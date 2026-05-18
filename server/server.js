require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', [], (err, transactions) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Lấy tất cả splits để map vào transactions
    db.all('SELECT transaction_id, person_name as name, amount FROM splits', [], (err, splits) => {
      if (err) return res.json(transactions); // Trả về transactions nếu lỗi split

      const enriched = transactions.map(t => ({
        ...t,
        splits: splits.filter(s => s.transaction_id === t.id)
      }));
      res.json(enriched);
    });
  });
});

// API: Lấy chi tiết một giao dịch (bao gồm splits)
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, transaction) => {
    if (err || !transaction) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });

    db.all('SELECT person_name as name, amount FROM splits WHERE transaction_id = ?', [id], (err, splits) => {
      res.json({ ...transaction, splits: splits || [] });
    });
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

// API: Quản lý danh mục
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/categories', (req, res) => {
  const { label, color, type, icon } = req.body;
  if (!label || !color) return res.status(400).json({ error: 'Thiếu thông tin' });
  const sql = 'INSERT INTO categories (label, color, type, icon) VALUES (?, ?, ?, ?)';
  db.run(sql, [label, color, type || 'expense', icon || '📦'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, label, color, type: type || 'expense', icon: icon || '📦' });
  });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { label, color, type, icon } = req.body;
  const sql = 'UPDATE categories SET label = ?, color = ?, type = ?, icon = ? WHERE id = ?';
  db.run(sql, [label, color, type, icon, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  // Kiểm tra xem có transaction nào đang dùng danh mục này không
  db.get('SELECT COUNT(*) as count FROM transactions WHERE categoryId = ?', [id], (err, row) => {
    if (row && row.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa danh mục đang có giao dịch' });
    }
    db.run('DELETE FROM categories WHERE id = ?', id, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// API: Lấy danh sách nợ (splits)
app.get('/api/debts', (req, res) => {
  const sql = `
    SELECT s.*, t.title as transaction_title, t.date 
    FROM splits s 
    JOIN transactions t ON s.transaction_id = t.id 
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

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Lỗi INSERT transaction:', err.message);
        return res.status(500).json({ error: err.message });
      }

      const transactionId = this.lastID;

      // Nếu có thông tin chia tiền, thêm vào bảng splits
      if (splits && Array.isArray(splits) && splits.length > 0) {
        const splitStmt = db.prepare('INSERT INTO splits (transaction_id, person_name, amount) VALUES (?, ?, ?)');
        splits.forEach(s => {
          splitStmt.run(transactionId, s.name, s.amount);
        });
        splitStmt.finalize((err) => {
          if (err) {
            console.error('Lỗi INSERT splits:', err.message);
            // Vẫn trả về thành công vì transaction chính đã lưu
          }
          res.json({ id: transactionId, date, title, amount, type, categoryId, by, splits });
        });
      } else {
        res.json({ id: transactionId, date, title, amount, type, categoryId, by });
      }
    });
  });
});

// API: Thêm quỹ tiết kiệm mới
app.post('/api/goals', (req, res) => {
  const { title, target, icon, color } = req.body;
  if (!title || !target) return res.status(400).json({ error: 'Thiếu thông tin' });

  const sql = 'INSERT INTO goals (title, current, target, icon, color) VALUES (?, 0, ?, ?, ?)';
  db.run(sql, [title, target, icon, color], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, current: 0, target, icon, color });
  });
});

// API: Nạp tiền vào quỹ
app.patch('/api/goals/:id/add-money', (req, res) => {
  const { amount } = req.body;
  const { id } = req.params;
  if (!amount) return res.status(400).json({ error: 'Thiếu số tiền' });

  db.run('UPDATE goals SET current = current + ? WHERE id = ?', [amount, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// API: Trả nợ (Hỗ trợ trả một phần)
app.patch('/api/splits/:id/pay', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body; // Số tiền khách trả lần này

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ' });

  // 1. Lấy thông tin nợ hiện tại
  db.get(`
    SELECT s.*, t.title as transaction_title 
    FROM splits s 
    JOIN transactions t ON s.transaction_id = t.id 
    WHERE s.id = ?`, [id], (err, split) => {

    if (err || !split) {
      console.error('Không tìm thấy split ID:', id);
      return res.status(404).json({ error: 'Không tìm thấy khoản nợ' });
    }

    const currentPaid = Number(split.paid_amount) || 0;
    const payAmt = Number(amount);
    const newPaidAmount = currentPaid + payAmt;
    const isPaid = newPaidAmount >= split.amount ? 1 : 0;

    // 1. Cập nhật bảng splits
    db.run('UPDATE splits SET paid_amount = ?, is_paid = ? WHERE id = ?', [newPaidAmount, isPaid, id], function (err) {
      if (err) {
        console.error('Lỗi cập nhật splits:', err.message);
        return res.status(500).json({ error: 'Lỗi cập nhật khoản nợ' });
      }

      // 2. Tự động tạo một Khoản thu (Income) trong bảng transactions
      const incomeTitle = `Thu hồi nợ: ${split.person_name} - ${split.transaction_title}`;
      const today = new Date().toISOString().split('T')[0];

      db.run(
        'INSERT INTO transactions (date, title, amount, type, categoryId, "by") VALUES (?, ?, ?, ?, ?, ?)',
        [today, incomeTitle, payAmt, 'income', 'other', 'me'],
        function (err) {
          if (err) {
            console.error('Lỗi tạo transaction thu hồi nợ:', err.message);
            // Vẫn trả về thành công vì bước 1 đã xong
          }

          res.json({
            success: true,
            isPaid,
            newPaidAmount,
            message: 'Đã cập nhật thanh toán'
          });
        }
      );
    });
  });
});

// Cập nhật giao dịch (có hỗ trợ cập nhật splits)
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { date, title, amount, type, categoryId, by, splits } = req.body;

  db.serialize(() => {
    // 1. Cập nhật thông tin chính
    const sql = 'UPDATE transactions SET date = ?, title = ?, amount = ?, type = ?, categoryId = ?, "by" = ? WHERE id = ?';
    db.run(sql, [date, title, amount, type, categoryId, by, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // 2. Xóa các splits cũ
      db.run('DELETE FROM splits WHERE transaction_id = ?', id, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 3. Thêm các splits mới nếu có
        if (splits && Array.isArray(splits)) {
          const splitStmt = db.prepare('INSERT INTO splits (transaction_id, person_name, amount) VALUES (?, ?, ?)');
          splits.forEach(s => {
            splitStmt.run(id, s.name, s.amount);
          });
          splitStmt.finalize();
        }

        res.json({ success: true });
      });
    });
  });
});

// Xóa giao dịch
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Cũng nên xóa splits liên quan nếu có
    db.run('DELETE FROM splits WHERE transaction_id = ?', id);
    res.json({ message: 'Đã xóa', changes: this.changes });
  });
});

// Cập nhật quỹ tiết kiệm
app.put('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  const { title, target, icon, color } = req.body;
  const sql = 'UPDATE goals SET title = ?, target = ?, icon = ?, color = ? WHERE id = ?';
  db.run(sql, [title, target, icon, color, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// Xóa quỹ tiết kiệm
app.delete('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM goals WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });

// ================= SETTINGS & PROFILE API =================

// API: Kiểm tra mật khẩu mở khóa
app.post('/api/settings/verify', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Thiếu mật khẩu' });
  db.get("SELECT value FROM settings WHERE key = 'password'", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy cấu hình mật khẩu' });
    if (row.value === password) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Mật khẩu không chính xác' });
    }
  });
});

// API: Lấy thông tin Profile (Username & Avatar)
app.get('/api/settings/profile', (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key IN ('username', 'avatar')", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const profile = {};
    rows.forEach(row => {
      profile[row.key] = row.value;
    });
    res.json(profile);
  });
});

// API: Cập nhật Profile (Username & Avatar)
app.put('/api/settings/profile', (req, res) => {
  const { username, avatar } = req.body;
  db.serialize(() => {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    if (username !== undefined) {
      stmt.run('username', username);
    }
    if (avatar !== undefined) {
      stmt.run('avatar', avatar);
    }
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// API: Lấy cài đặt hệ thống
app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  });
});

// API: Cập nhật cài đặt
app.post('/api/settings', (req, res) => {
  const settings = req.body; // { key: value }
  const keys = Object.keys(settings);

  db.serialize(() => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    keys.forEach(key => {
      stmt.run(key, settings[key].toString());
    });
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// API: Thay đổi mật khẩu
app.put('/api/settings/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin mật khẩu' });

  db.get("SELECT value FROM settings WHERE key = 'password'", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy cấu hình mật khẩu' });
    
    if (row.value !== currentPassword) {
      return res.json({ success: false, error: 'Mật khẩu hiện tại không chính xác' });
    }

    db.run("UPDATE settings SET value = ? WHERE key = 'password'", [newPassword], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// API: Xóa sạch dữ liệu hệ thống
app.post('/api/system/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM transactions');
    db.run('DELETE FROM splits');
    db.run('DELETE FROM goals');
    // Giữ lại categories và settings
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
