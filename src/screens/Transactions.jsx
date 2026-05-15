import React, { useState, useMemo } from 'react';
import { Filter, ShoppingBag, Utensils, Zap, Coffee, PiggyBank, Home as HomeIcon, CreditCard, Banknote, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../context/CategoryContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './Transactions.css';

// Helper to map category to icon
const getIconForCategory = (categoryId) => {
  switch (categoryId) {
    case 'food': return <Utensils size={20} />;
    case 'rent': return <HomeIcon size={20} />;
    case 'utilities': return <Zap size={20} />;
    case 'transport': return <CreditCard size={20} />;
    case 'shopping': return <ShoppingBag size={20} />;
    case 'appliances': return <Coffee size={20} />; // Close enough for now
    case 'savings': return <PiggyBank size={20} />;
    case 'salary':
    case 'bonus': return <Banknote size={20} />;
    default: return <Coffee size={20} />;
  }
};

const getByName = (by) => {
  if (by === 'me') return 'Tôi';
  if (by === 'partner') return 'Vợ/Chồng';
  return 'Quỹ chung';
};

// Format Date string 'YYYY-MM-DD' -> 'DD/MM'
const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
};

const Transactions = () => {
  const { transactions, deleteTransaction } = useTransactions();
  const { categories } = useCategories();
  const { addToast } = useToast();
  
  // Create a lookup map for categories
  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [categories]);

  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Confirm delete modal state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedMonth, selectedCategory, selectedType, transactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="screen-container">
      {/* Filters */}
      <div className="filters-grid mb-6">
        <select
          className="month-filter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="all">Tất cả thời gian</option>
          <option value="2026-05">Tháng 5, 2026</option>
          <option value="2026-04">Tháng 4, 2026</option>
        </select>

        <select
          className="month-filter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">Tất cả loại</option>
          <option value="expense">Khoản chi (-)</option>
          <option value="income">Khoản thu (+)</option>
        </select>

        <select 
          className="month-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Tất cả</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Summary for the month */}
      <div className="card month-summary mb-6">
        <div className="summary-col">
          <span className="text-muted">Tổng thu</span>
          <span className="font-semibold text-primary">{formatCurrency(totalIncome)} đ</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-col">
          <span className="text-muted">Tổng chi</span>
          <span className="font-semibold text-accent">-{formatCurrency(totalExpense)} đ</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="timeline">
        {filteredTransactions.length === 0 && (
          <div className="text-center text-muted" style={{ padding: '40px 0', textAlign: 'center' }}>
            Không có giao dịch nào
          </div>
        )}

        {filteredTransactions.map((t, index) => {
          const showDate = index === 0 || filteredTransactions[index - 1].date !== t.date;
          const category = categoriesMap[t.categoryId] || { label: 'Khác', color: 'var(--text-muted)' };
          
          return (
            <React.Fragment key={t.id}>
              {showDate && (
                <div className="timeline-date">{formatDate(t.date)}</div>
              )}
              <div className="transaction-item card">
                <div className="t-icon-wrapper" style={{ backgroundColor: category.color + '15', color: category.color, fontSize: '20px' }}>
                  {category.icon || '📦'}
                </div>
                <div className="t-details">
                  <h4 className="t-title">{t.title}</h4>
                  <div className="t-meta">
                    <span>{category.label}</span>
                    <span className="dot">•</span>
                    <span>{getByName(t.by)}</span>
                  </div>
                </div>
                <div className={`t-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)} đ
                </div>
                <div className="t-actions">
                  <button
                    className="btn-delete-small"
                    onClick={() => setConfirmDelete({ isOpen: true, id: t.id })}
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác."
        onConfirm={async () => {
          const res = await deleteTransaction(confirmDelete.id);
          if (res.ok) {
            addToast('Đã xóa giao dịch thành công!', 'info');
          } else {
            addToast('Lỗi khi xóa giao dịch', 'error');
          }
          setConfirmDelete({ isOpen: false, id: null });
        }}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default Transactions;
