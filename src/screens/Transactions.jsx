import React, { useState, useMemo } from 'react';
import { Filter, ShoppingBag, Utensils, Zap, Coffee, PiggyBank, Home as HomeIcon, CreditCard, Banknote } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { formatCurrency } from '../utils/format';
import { useTransactions } from '../hooks/useTransactions';
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
  const { transactions } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchMonth = t.date.startsWith(selectedMonth);
      const matchCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
      return matchMonth && matchCategory;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedMonth, selectedCategory, transactions]);

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
      <div className="flex-between mb-4">
        <select 
          className="month-filter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="2026-05">Tháng 5, 2026</option>
          <option value="2026-04">Tháng 4, 2026</option>
        </select>
        
        <select 
          className="month-filter"
          style={{marginLeft: '8px', flex: 1}}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {Object.values(CATEGORIES).map(cat => (
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
          <div className="text-center text-muted" style={{padding: '40px 0', textAlign: 'center'}}>
            Không có giao dịch nào
          </div>
        )}
        
        {filteredTransactions.map((t, index) => {
          const showDate = index === 0 || filteredTransactions[index - 1].date !== t.date;
          const category = CATEGORIES[t.categoryId] || CATEGORIES['other'];
          
          return (
            <React.Fragment key={t.id}>
              {showDate && (
                <div className="timeline-date">{formatDate(t.date)}</div>
              )}
              <div className="transaction-item card">
                <div className="t-icon-wrapper" style={{color: category.color}}>
                  {getIconForCategory(t.categoryId)}
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
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Transactions;
