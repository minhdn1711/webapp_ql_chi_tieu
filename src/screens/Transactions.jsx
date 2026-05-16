import React, { useState, useMemo } from 'react';
import { Filter, ShoppingBag, Utensils, Zap, Coffee, PiggyBank, Home as HomeIcon, CreditCard, Banknote, Trash2, Edit2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  
  // Create a lookup map for categories with legacy support
  const categoriesMap = useMemo(() => {
    const map = categories.reduce((acc, cat) => {
      acc[cat.id.toString()] = cat;
      acc[cat.label.toLowerCase()] = cat;
      return acc;
    }, {});

    const legacy = {
      'food': { label: 'Ăn uống', color: 'var(--accent-pink)', icon: '🍔' },
      'rent': { label: 'Tiền nhà', color: '#6d9177', icon: '🏠' },
      'utilities': { label: 'Điện nước', color: '#E0A96D', icon: '⚡' },
      'transport': { label: 'Di chuyển', color: '#9B9B9B', icon: '🚗' },
      'shopping': { label: 'Mua sắm', color: 'var(--primary-green)', icon: '🛍️' },
      'salary': { label: 'Lương', color: 'var(--primary-green)', icon: '💰' },
      'bonus': { label: 'Thưởng', color: '#E0A96D', icon: '🎁' }
    };

    return { ...legacy, ...map };
  }, [categories]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Advanced Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Confirm delete modal state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Month filter (only if not using specific date range)
      if (!startDate && !endDate && selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      
      // 2. Date range filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      // 3. Category filter
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      
      // 4. Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // 5. Search query
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedMonth, selectedCategory, selectedType, searchQuery, startDate, endDate, transactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const splitAmount = curr.splits ? curr.splits.reduce((sum, s) => sum + s.amount, 0) : 0;
        return acc + (curr.amount - splitAmount);
      }, 0);
  }, [filteredTransactions]);

  return (
    <div className="screen-container">
      {/* Search Bar */}
      <div className="search-bar-container mb-4">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm giao dịch..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <X size={18} className="clear-icon" onClick={() => setSearchQuery('')} />}
        </div>
        <button 
          className={`filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className={`filters-grid mb-6 ${showAdvancedFilters ? 'expanded' : ''}`}>
        <div className="filter-item">
          <label className="mini-label">Theo tháng</label>
          <select
            className="month-filter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setStartDate('');
              setEndDate('');
            }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="2026-05">Tháng 5, 2026</option>
            <option value="2026-04">Tháng 4, 2026</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="mini-label">Loại</label>
          <select
            className="month-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value="expense">Khoản chi (-)</option>
            <option value="income">Khoản thu (+)</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="mini-label">Danh mục</label>
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

        {showAdvancedFilters && (
          <>
            <div className="filter-item">
              <label className="mini-label">Từ ngày</label>
              <input 
                type="date" 
                className="month-filter" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label className="mini-label">Đến ngày</label>
              <input 
                type="date" 
                className="month-filter" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
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
          const categoryIdStr = t.categoryId ? t.categoryId.toString() : 'other';
          const category = categoriesMap[categoryIdStr] || { label: 'Khác', color: 'var(--text-muted)', icon: '📦' };
          
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
                    {t.splits && t.splits.length > 0 && (
                      <>
                        <span className="dot">•</span>
                        <span className="split-badge">Chia tiền</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`t-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {t.splits && t.splits.length > 0 ? (
                    <>
                      {formatCurrency(t.amount)} đ
                      <span className="t-amount-total">Vợ chồng: {formatCurrency(t.amount - t.splits.reduce((sum, s) => sum + s.amount, 0))}</span>
                    </>
                  ) : (
                    <>{formatCurrency(t.amount)} đ</>
                  )}
                </div>
                <div className="t-actions">
                  <Link 
                    to={`/edit/${t.id}`}
                    className="btn-delete-small"
                    style={{ color: 'var(--text-muted)' }}
                    title="Sửa"
                  >
                    <Edit2 size={16} />
                  </Link>
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
