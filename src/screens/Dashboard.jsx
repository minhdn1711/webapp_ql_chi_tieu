import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, ArrowDownCircle, ArrowUpCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { useTransactions } from '../hooks/useTransactions';
import './Dashboard.css';

const Dashboard = () => {
  const { transactions } = useTransactions();
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    fetch('/api/goals').then(res => res.json()).then(setGoals);
    fetch('/api/debts').then(res => res.json()).then(setDebts);
  }, []);

  // Calculate for current month (May 2026 as per mock)
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith('2026-05'));
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  const remainingBalance = totalIncome - totalExpense;

  // Calculate spending by category for the chart
  const categorySpending = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
      return acc;
    }, {});
    
    // Convert to array and sort by amount descending
    const sorted = Object.entries(grouped)
      .map(([id, amount]) => ({ id, amount, ...CATEGORIES[id] }))
      .sort((a, b) => b.amount - a.amount);
      
    // Get top 4 or group others
    if (sorted.length <= 4) return sorted;
    const top3 = sorted.slice(0, 3);
    const othersAmount = sorted.slice(3).reduce((acc, curr) => acc + curr.amount, 0);
    return [...top3, { id: 'other', label: 'Khác', color: 'var(--text-muted)', amount: othersAmount }];
  }, [currentMonthTransactions]);

  // Find max spending for chart relative heights
  const maxSpending = Math.max(...categorySpending.map(c => c.amount), 1);

  // Top Saving Goal
  const topGoal = goals[0] || { title: 'Chưa có quỹ', current: 0, target: 1, icon: '💰' };
  const goalPercent = Math.round((topGoal.current / topGoal.target) * 100);

  const totalDebt = debts.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="screen-container">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card balance-card">
          <p className="form-label text-white-muted">Số dư còn lại</p>
          <h2 className="balance-amount">{remainingBalance.toLocaleString()} đ</h2>
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
        </div>
        
        {totalDebt > 0 && (
          <NavLink to="/debts" className="card debt-summary-card flex-between" style={{textDecoration: 'none', color: 'inherit', marginTop: '-8px'}}>
            <div>
              <p className="form-label text-muted" style={{marginBottom: '4px'}}>Bạn bè đang nợ</p>
              <h3 className="debt-amount-text" style={{color: 'var(--primary-green)', fontWeight: '800', margin: 0}}>+{totalDebt.toLocaleString()} đ</h3>
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
                  title={`${cat.amount.toLocaleString()} đ`}
                ></div>
                <span className="bar-label">{cat.label}</span>
              </div>
            ))}
          </div>
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
            <div className="progress-bar-fill" style={{width: `${goalPercent}%`}}></div>
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
