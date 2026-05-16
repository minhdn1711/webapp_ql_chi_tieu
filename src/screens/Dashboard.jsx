import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, ArrowDownCircle, ArrowUpCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../context/CategoryContext';
import './Dashboard.css';

const Dashboard = () => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);

  // Create a lookup map for categories with legacy support
  const categoriesMap = useMemo(() => {
    const map = (categories || []).reduce((acc, cat) => {
      if (cat && cat.id) acc[cat.id.toString()] = cat;
      if (cat && cat.label) {
        acc[cat.label.toLowerCase()] = cat;
        // Also map by direct label for some legacy cases
        acc[cat.label] = cat;
      }
      return acc;
    }, {});

    // Legacy mapping for hardcoded string IDs
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

  useEffect(() => {
    fetch('/api/goals').then(res => res.json()).then(setGoals).catch(() => setGoals([]));
    fetch('/api/debts').then(res => res.json()).then(setDebts).catch(() => setDebts([]));
  }, []);

  // Calculate for current month dynamically
  const currentMonth = useMemo(() => {
    return new Date().toISOString().substring(0, 7); // "YYYY-MM"
  }, []);

  const currentMonthTransactions = useMemo(() => {
    return (transactions || []).filter(t => t && t.date && t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [currentMonthTransactions]);

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [currentMonthTransactions]);

  const totalReceivable = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const splitAmount = curr.splits ? curr.splits.reduce((sum, s) => sum + (s.amount || 0), 0) : 0;
        return acc + splitAmount;
      }, 0);
  }, [currentMonthTransactions]);

  const remainingBalance = totalIncome - totalExpense;

  // Calculate spending by category for the chart
  const categorySpending = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      let catId = 'other';
      if (curr.categoryId) {
        catId = curr.categoryId.toString();
      } else if (curr.category) {
        // Fallback for some very old data that might have 'category' field
        catId = curr.category.toString();
      }
      acc[catId] = (acc[catId] || 0) + (curr.amount || 0);
      return acc;
    }, {});

    const sorted = Object.entries(grouped)
      .map(([id, amount]) => ({
        id,
        amount,
        ...(categoriesMap[id] || 
            categoriesMap[id.toLowerCase()] || 
            { label: 'Khác', color: 'var(--text-muted)' })
      }))
      .sort((a, b) => b.amount - a.amount);

    if (sorted.length <= 7) return sorted;
    const top6 = sorted.slice(0, 6);
    const othersAmount = sorted.slice(6).reduce((acc, curr) => acc + curr.amount, 0);
    return [...top6, { id: 'other', label: 'Khác', color: 'var(--text-muted)', amount: othersAmount }];
  }, [currentMonthTransactions, categoriesMap]);

  // Calculate spending by payer
  const payerSpending = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.by] = (acc[curr.by] || 0) + curr.amount;
      return acc;
    }, { me: 0, partner: 0, shared: 0 });

    return [
      { id: 'me', label: 'Tôi chi', amount: grouped.me, color: 'var(--primary-green)' },
      { id: 'partner', label: 'Vợ/Chồng chi', amount: grouped.partner, color: 'var(--accent-pink)' },
      { id: 'shared', label: 'Quỹ chung', amount: grouped.shared, color: '#3B82F6' }
    ].sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Find max spending for chart relative heights
  const maxSpending = Math.max(...categorySpending.map(c => c.amount), 1);

  // Top Saving Goal
  const topGoal = goals[0] || { title: 'Chưa có quỹ', current: 0, target: 1, icon: '💰' };
  const goalPercent = topGoal.target ? Math.round(((topGoal.current || 0) / topGoal.target) * 100) : 0;

  const totalDebt = (debts || [])
    .filter(d => d && d.is_paid === 0)
    .reduce((acc, curr) => acc + ((curr?.amount || 0) - (curr?.paid_amount || 0)), 0);

  return (
    <div className="screen-container">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card balance-card">
          <p className="form-label text-white-muted">Số dư còn lại</p>
          <h2 className="balance-amount">{formatCurrency(remainingBalance)} đ</h2>
          <div className="flex-between mt-4">
            <div className="income-expense">
              <ArrowDownCircle size={16} color="#F2C4C4" />
              <span>Thu: {(totalIncome / 1000000).toFixed(1)}Tr</span>
            </div>
            <div className="income-expense">
              <ArrowUpCircle size={16} color="#F2C4C4" />
              <span>Chi: {(totalExpense / 1000000).toFixed(1)}Tr</span>
            </div>
          </div>
          {totalReceivable > 0 && (
            <div className="receivable-note mt-2">
              <span>Trong đó cho vay/chia: <strong>{formatCurrency(totalReceivable)} đ</strong></span>
            </div>
          )}
        </div>

        {totalDebt > 0 && (
          <NavLink to="/debts" className="card debt-summary-card flex-between" style={{ textDecoration: 'none', color: 'inherit', marginTop: '-8px' }}>
            <div>
              <p className="form-label text-muted" style={{ marginBottom: '4px' }}>Bạn bè đang nợ</p>
              <h3 className="debt-amount-text" style={{ color: 'var(--primary-green)', fontWeight: '800', margin: 0 }}>+{formatCurrency(totalDebt)} đ</h3>
            </div>
            <ChevronRight size={20} color="var(--primary-green)" />
          </NavLink>
        )}
      </div>

      {/* Spending Chart */}
      <div className="card chart-card mb-6">
        <div className="flex-between mb-4">
          <h3>Chi tiêu theo danh mục</h3>
          <TrendingUp size={18} color="var(--text-muted)" />
        </div>
        <div className="chart-placeholder">
          <div className="chart-bars">
            {categorySpending.map(cat => (
              <div className="bar-group" key={cat.id}>
                <div
                  className="bar"
                  style={{
                    height: `${Math.max((cat.amount / maxSpending) * 100, 10)}%`,
                    backgroundColor: cat.color
                  }}
                  title={`${formatCurrency(cat.amount)} đ`}
                ></div>
                <span className="bar-label">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payer Analysis Section */}
      <div className="card payer-analysis mb-6">
        <h3 className="mb-4">Thu chi cá nhân</h3>
        <div className="payer-list">
          {payerSpending.map(payer => {
            const payerPercent = totalExpense > 0 ? Math.round((payer.amount / totalExpense) * 100) : 0;
            return (
              <div key={payer.id} className="payer-item">
                <div className="flex-between mb-1">
                  <span className="payer-label">{payer.label}</span>
                  <span className="payer-amount">{formatCurrency(payer.amount)} đ ({payerPercent}%)</span>
                </div>
                <div className="progress-bar-bg mini">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${payerPercent}%`, backgroundColor: payer.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saving Goal Progress */}
      <div className="card">
        <div className="flex-between mb-2">
          <h3>Mục tiêu tiết kiệm</h3>
          <NavLink to="/goals" className="view-all">
            Xem tất cả <ChevronRight size={16} />
          </NavLink>
        </div>

        <div className="goal-item">
          <div className="flex-between mb-2">
            <div className="flex-row gap-2">
              <span className="goal-icon">{topGoal.icon}</span>
              <span className="font-medium">{topGoal.title}</span>
            </div>
            <span className="font-semibold text-primary">{goalPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${goalPercent}%` }}></div>
          </div>
          <p className="text-muted mt-2 text-right">Đã gom: {(topGoal.current / 1000000).toFixed(1)}Tr / {(topGoal.target / 1000000).toFixed(1)}Tr</p>
        </div>
      </div>

      {/* Floating Action Button */}
      <NavLink to="/add" className="fab">
        <Plus size={28} />
      </NavLink>
    </div>
  );
};

export default Dashboard;
