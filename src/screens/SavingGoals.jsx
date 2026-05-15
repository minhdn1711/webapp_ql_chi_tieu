import React from 'react';
import { Plus } from 'lucide-react';
import './SavingGoals.css';

const GOALS = [
  { id: 1, title: 'Quỹ du lịch Phú Quốc', current: 12000000, target: 20000000, icon: '✈️', color: 'var(--primary-green)' },
  { id: 2, title: 'Quỹ dự phòng (6 tháng)', current: 45000000, target: 120000000, icon: '🛡️', color: 'var(--accent-pink)' },
  { id: 3, title: 'Mua máy sấy quần áo', current: 5000000, target: 8000000, icon: '🧺', color: '#E0A96D' }
];

const SavingGoals = () => {
  return (
    <div className="screen-container">
      <div className="flex-between mb-6 mt-4">
        <h2>Các quỹ hiện tại</h2>
        <button className="add-goal-btn">
          <Plus size={16} />
          Thêm quỹ
        </button>
      </div>

      <div className="goals-list">
        {GOALS.map(goal => {
          const percent = Math.round((goal.current / goal.target) * 100);
          
          return (
            <div key={goal.id} className="card goal-card">
              <div className="goal-header">
                <div className="goal-icon-large">{goal.icon}</div>
                <div className="goal-title-wrapper">
                  <h3 className="goal-title">{goal.title}</h3>
                  <p className="goal-status text-muted">Đạt {percent}%</p>
                </div>
              </div>
              
              <div className="goal-progress-container">
                <div className="progress-bg">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percent}%`, backgroundColor: goal.color }}
                  ></div>
                </div>
              </div>
              
              <div className="goal-footer">
                <div className="g-col">
                  <span className="g-label">Hiện có</span>
                  <span className="g-amount" style={{ color: goal.color }}>{goal.current.toLocaleString()} đ</span>
                </div>
                <div className="g-col text-right">
                  <span className="g-label">Mục tiêu</span>
                  <span className="g-amount text-muted">{goal.target.toLocaleString()} đ</span>
                </div>
              </div>
              
              <button className="btn-add-money">
                Nạp thêm tiền
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavingGoals;
