export const CATEGORIES = {
  food: { id: 'food', label: 'Ăn uống', color: 'var(--accent-pink)' },
  rent: { id: 'rent', label: 'Tiền nhà', color: '#6d9177' },
  utilities: { id: 'utilities', label: 'Điện nước', color: '#E0A96D' },
  transport: { id: 'transport', label: 'Di chuyển', color: '#9B9B9B' },
  shopping: { id: 'shopping', label: 'Mua sắm', color: 'var(--primary-green)' },
  appliances: { id: 'appliances', label: 'Gia dụng', color: '#D4878A' },
  savings: { id: 'savings', label: 'Tiết kiệm', color: '#8FAF96' },
  salary: { id: 'salary', label: 'Lương', color: 'var(--primary-green)' },
  bonus: { id: 'bonus', label: 'Thưởng', color: '#E0A96D' },
  other: { id: 'other', label: 'Khác', color: 'var(--text-muted)' }
};

export const MOCK_GOALS = [
  { id: 1, title: 'Quỹ du lịch Phú Quốc', current: 12000000, target: 20000000, icon: '✈️', color: 'var(--primary-green)' },
  { id: 2, title: 'Quỹ dự phòng (6 tháng)', current: 45000000, target: 120000000, icon: '🛡️', color: 'var(--accent-pink)' },
  { id: 3, title: 'Mua máy sấy quần áo', current: 5000000, target: 8000000, icon: '🧺', color: '#E0A96D' }
];

export const MOCK_TRANSACTIONS = [
  // Current Month (May 2026)
  { id: 1, date: '2026-05-14', title: 'Đi siêu thị Lotte', amount: 1250000, type: 'expense', categoryId: 'food', by: 'shared' },
  { id: 2, date: '2026-05-14', title: 'Ăn trưa công ty', amount: 55000, type: 'expense', categoryId: 'food', by: 'me' },
  { id: 3, date: '2026-05-13', title: 'Tiền điện nước tháng 4', amount: 850000, type: 'expense', categoryId: 'utilities', by: 'partner' },
  { id: 4, date: '2026-05-12', title: 'Đổ xăng', amount: 100000, type: 'expense', categoryId: 'transport', by: 'me' },
  { id: 5, date: '2026-05-10', title: 'Lương vợ', amount: 22000000, type: 'income', categoryId: 'salary', by: 'partner' },
  { id: 6, date: '2026-05-05', title: 'Lương chồng', amount: 25000000, type: 'income', categoryId: 'salary', by: 'me' },
  { id: 7, date: '2026-05-02', title: 'Đóng tiền nhà', amount: 8000000, type: 'expense', categoryId: 'rent', by: 'shared' },
  { id: 8, date: '2026-05-01', title: 'Mua chảo chống dính', amount: 450000, type: 'expense', categoryId: 'appliances', by: 'shared' },
  { id: 9, date: '2026-05-11', title: 'Chuyển vào quỹ dự phòng', amount: 5000000, type: 'expense', categoryId: 'savings', by: 'shared' },
  
  // Previous Month (April 2026)
  { id: 10, date: '2026-04-28', title: 'Quần áo Uniqlo', amount: 1500000, type: 'expense', categoryId: 'shopping', by: 'partner' },
  { id: 11, date: '2026-04-25', title: 'Xem phim', amount: 300000, type: 'expense', categoryId: 'food', by: 'me' },
  { id: 12, date: '2026-04-10', title: 'Lương vợ', amount: 22000000, type: 'income', categoryId: 'salary', by: 'partner' },
  { id: 13, date: '2026-04-05', title: 'Lương chồng', amount: 25000000, type: 'income', categoryId: 'salary', by: 'me' },
  { id: 14, date: '2026-04-02', title: 'Đóng tiền nhà', amount: 8000000, type: 'expense', categoryId: 'rent', by: 'shared' }
];
