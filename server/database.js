const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production' 
  ? path.resolve('/app/data', 'database.sqlite')
  : path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
  } else {
    console.log('Đã kết nối với SQLite database.');
    
    // Khởi tạo bảng dữ liệu
    db.serialize(() => {
      // Bảng giao dịch
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          "by" TEXT NOT NULL
        )
      `);

      // Bảng danh mục
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          icon TEXT
        )
      `, () => {
        // Migration: Thêm các cột nếu database cũ chưa có
        db.run("ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'", () => {});
        db.run("ALTER TABLE categories ADD COLUMN icon TEXT", () => {});
        
        // Seed default categories if empty
        db.get("SELECT COUNT(*) AS count FROM categories", (err, row) => {
          if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO categories (label, color, type, icon) VALUES (?, ?, ?, ?)");
            const defaults = [
              ['Ăn uống', 'var(--accent-pink)', 'expense', '🍔'],
              ['Tiền nhà', '#6d9177', 'expense', '🏠'],
              ['Điện nước', '#E0A96D', 'expense', '⚡'],
              ['Di chuyển', '#9B9B9B', 'expense', '🚗'],
              ['Cho vay', '#3B82F6', 'expense', '🤝'],
              ['Mua sắm', 'var(--primary-green)', 'expense', '🛍️'],
              ['Lương', 'var(--primary-green)', 'income', '💰'],
              ['Thưởng', '#E0A96D', 'income', '🎁'],
              ['Khác', 'var(--text-muted)', 'expense', '📦'],
              ['Khác', 'var(--text-muted)', 'income', '🧧']
            ];
            defaults.forEach(c => stmt.run(c));
            stmt.finalize();
          }
        });
      });

      // Bảng mục tiêu tiết kiệm
      db.run(`
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          current INTEGER NOT NULL DEFAULT 0,
          target INTEGER NOT NULL,
          icon TEXT,
          color TEXT
        )
      `);

      // Bảng hạng mục chi tiêu trong quỹ
      db.run(`
        CREATE TABLE IF NOT EXISTS goal_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          goal_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          amount INTEGER NOT NULL DEFAULT 0,
          date TEXT NOT NULL,
          FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
        )
      `);

      // Bảng cài đặt hệ thống (Số tiền ban đầu, Vàng...)
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `, () => {
        // Seed default settings
        db.get("SELECT COUNT(*) AS count FROM settings", (err, row) => {
          if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
            stmt.run(['initial_balance', '0']);
            stmt.run(['gold_amount', '0']);
            stmt.finalize();
          }
        });
      });

      // Bảng chia tiền (Split bill)
      db.run(`
        CREATE TABLE IF NOT EXISTS splits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id INTEGER,
          person_name TEXT NOT NULL,
          amount INTEGER NOT NULL,
          paid_amount INTEGER DEFAULT 0,
          is_paid INTEGER DEFAULT 0,
          FOREIGN KEY(transaction_id) REFERENCES transactions(id)
        )
      `, () => {
        // Migration: Thêm cột nếu database cũ chưa có
        db.run("ALTER TABLE splits ADD COLUMN paid_amount INTEGER DEFAULT 0", (err) => {
          if (err && !err.message.includes("duplicate column name")) {
            // ignore if column exists
          }
        });
        db.run("ALTER TABLE splits ADD COLUMN is_paid INTEGER DEFAULT 0", (err) => {
          if (err && !err.message.includes("duplicate column name")) {
             // ignore if column exists
          }
        });
      });

      // Bảng cài đặt (settings) lưu cấu hình mật khẩu, avatar, tên hiển thị
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `, () => {
        // Kiểm tra xem đã có cấu hình mật khẩu (password) trong bảng cài đặt chưa
        db.get("SELECT COUNT(*) AS count FROM settings WHERE key = 'password'", (err, row) => {
          if (row && row.count === 0) {
            // Nếu chưa có mật khẩu, tiến hành thêm mật mã mặc định và thông tin hồ sơ mặc định
            const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
            stmt.run(['password', '260426']);
            stmt.run(['avatar', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix']);
            stmt.run(['username', 'Gia Đình Nhỏ']);
            stmt.finalize();
            console.log('Đã khởi tạo mật mã và hồ sơ mặc định.');
          } else {
            // Tự động chuyển đổi mật khẩu mặc định cũ 26042026 sang mật khẩu mặc định mới 260426
            db.run("UPDATE settings SET value = '260426' WHERE key = 'password' AND value = '26042026'");
          }
        });
      });

      /*
      // Kiểm tra xem database có trống không, nếu trống thì insert dữ liệu mẫu
      db.get("SELECT COUNT(*) AS count FROM transactions", (err, row) => {
        if (row && row.count === 0) {
          console.log("Database trống. Đang thêm dữ liệu mẫu...");
          
          // Seed Transactions
          const tStmt = db.prepare("INSERT INTO transactions (date, title, amount, type, categoryId, \"by\") VALUES (?, ?, ?, ?, ?, ?)");
          const mockTransactions = [
            ['2026-05-14', 'Đi siêu thị Lotte', 1250000, 'expense', 'food', 'shared'],
            ['2026-05-14', 'Ăn trưa công ty', 55000, 'expense', 'food', 'me'],
            ['2026-05-13', 'Tiền điện nước tháng 4', 850000, 'expense', 'utilities', 'partner'],
            ['2026-05-10', 'Lương vợ', 22000000, 'income', 'salary', 'partner'],
            ['2026-05-05', 'Lương chồng', 25000000, 'income', 'salary', 'me'],
          ];
          mockTransactions.forEach(t => tStmt.run(t));
          tStmt.finalize();

          // Seed Goals
          const gStmt = db.prepare("INSERT INTO goals (title, current, target, icon, color) VALUES (?, ?, ?, ?, ?)");
          const mockGoals = [
            ['Quỹ du lịch Phú Quốc', 12000000, 20000000, '✈️', 'var(--primary-green)'],
            ['Quỹ dự phòng (6 tháng)', 45000000, 120000000, '🛡️', 'var(--accent-pink)'],
            ['Mua máy sấy quần áo', 5000000, 8000000, '🧺', '#E0A96D']
          ];
          mockGoals.forEach(g => gStmt.run(g));
          gStmt.finalize();
        }
      });
      */
    });
  }
});

module.exports = db;
