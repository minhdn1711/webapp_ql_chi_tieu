require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API: Lấy danh sách giao dịch
app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: Lấy danh sách mục tiêu tiết kiệm
app.get('/api/goals', (req, res) => {
  db.all('SELECT * FROM goals', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: Lấy danh sách nợ cần thu (splits chưa thanh toán)
app.get('/api/debts', (req, res) => {
  const sql = `
    SELECT s.*, t.title as transaction_title, t.date 
    FROM splits s 
    JOIN transactions t ON s.transaction_id = t.id 
    WHERE s.is_paid = 0
    ORDER BY t.date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: Thêm giao dịch mới (có hỗ trợ chia tiền)
app.post('/api/transactions', (req, res) => {
  const { date, title, amount, type, categoryId, by, splits } = req.body;
  
  if (!date || !title || amount === undefined || !type || !categoryId || !by) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  db.serialize(() => {
    const sql = 'INSERT INTO transactions (date, title, amount, type, categoryId, "by") VALUES (?, ?, ?, ?, ?, ?)';
    const params = [date, title, amount, type, categoryId, by];

    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const transactionId = this.lastID;

      // Nếu có thông tin chia tiền, thêm vào bảng splits
      if (splits && Array.isArray(splits)) {
        const splitStmt = db.prepare('INSERT INTO splits (transaction_id, person_name, amount) VALUES (?, ?, ?)');
        splits.forEach(s => {
          splitStmt.run(transactionId, s.name, s.amount);
        });
        splitStmt.finalize();
      }

      res.json({ id: transactionId, date, title, amount, type, categoryId, by });
    });
  });
});

// API: Thêm quỹ tiết kiệm mới
app.post('/api/goals', (req, res) => {
  const { title, target, icon, color } = req.body;
  if (!title || !target) return res.status(400).json({ error: 'Thiếu thông tin' });

  const sql = 'INSERT INTO goals (title, current, target, icon, color) VALUES (?, 0, ?, ?, ?)';
  db.run(sql, [title, target, icon, color], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, current: 0, target, icon, color });
  });
});

// API: Nạp tiền vào quỹ
app.patch('/api/goals/:id/add-money', (req, res) => {
  const { amount } = req.body;
  const { id } = req.params;
  if (!amount) return res.status(400).json({ error: 'Thiếu số tiền' });

  db.run('UPDATE goals SET current = current + ? WHERE id = ?', [amount, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// API: Đánh dấu đã trả nợ
app.patch('/api/splits/:id/pay', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE splits SET is_paid = 1 WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// Xóa giao dịch
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Đã xóa', changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
