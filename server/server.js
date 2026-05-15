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

// API: Thêm giao dịch mới
app.post('/api/transactions', (req, res) => {
  const { date, title, amount, type, categoryId, by } = req.body;
  
  if (!date || !title || amount === undefined || !type || !categoryId || !by) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const sql = 'INSERT INTO transactions (date, title, amount, type, categoryId, "by") VALUES (?, ?, ?, ?, ?, ?)';
  const params = [date, title, amount, type, categoryId, by];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      date,
      title,
      amount,
      type,
      categoryId,
      by
    });
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
