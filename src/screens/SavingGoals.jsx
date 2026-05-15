import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { formatCurrency, formatInput, getRawAmount } from '../utils/format';
import { useToast } from '../context/ToastContext';
import './SavingGoals.css';

const SavingGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const { addToast } = useToast();
  
  // Form states
  const [newGoal, setNewGoal] = useState({ title: '', target: '', icon: '💰', color: '#10B981' });
  const [topUpAmount, setTopUpAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu quỹ:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGoal,
          target: getRawAmount(newGoal.target)
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewGoal({ title: '', target: '', icon: '💰', color: '#10B981' });
        addToast('Đã tạo quỹ tiết kiệm mới!', 'success');
        fetchGoals();
      }
    } catch (err) {
      console.error('Lỗi thêm quỹ:', err);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/add-money`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: getRawAmount(topUpAmount) })
      });
      if (res.ok) {
        setShowTopUpModal(false);
        setTopUpAmount('');
        addToast('Nạp tiền vào quỹ thành công!', 'success');
        fetchGoals();
      }
    } catch (err) {
      console.error('Lỗi nạp tiền:', err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa quỹ này?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addToast('Đã xóa quỹ tiết kiệm', 'info');
        fetchGoals();
      }
    } catch (err) {
      console.error('Lỗi xóa quỹ:', err);
    }
  };

  if (loading) return <div className="screen-container">Đang tải...</div>;

  return (
    <div className="screen-container">
      <div className="flex-between mb-6 mt-4">
        <h2>Các quỹ hiện tại</h2>
        <button className="add-goal-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Thêm quỹ
        </button>
      </div>

      <div className="goals-list">
        {goals.map(goal => {
          const percent = goal.target ? Math.min(Math.round(((goal.current || 0) / goal.target) * 100), 100) : 0;
          
          return (
            <div key={goal.id} className="card goal-card">
              <div className="goal-header">
                <div className="goal-icon-large">{goal.icon || '💰'}</div>
                <div className="goal-title-wrapper">
                  <h3 className="goal-title">{goal.title}</h3>
                  <p className="goal-status text-muted">Đạt {percent}%</p>
                </div>
                <button 
                  className="btn-delete-goal" 
                  onClick={() => handleDeleteGoal(goal.id)}
                  title="Xóa quỹ"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="goal-progress-container">
                <div className="progress-bg">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percent}%`, backgroundColor: goal.color || '#10B981' }}
                  ></div>
                </div>
              </div>
              
              <div className="goal-footer">
                <div className="g-col">
                  <span className="g-label">Hiện có</span>
                  <span className="g-amount" style={{ color: goal.color || '#10B981' }}>{formatCurrency(goal.current)} đ</span>
                </div>
                <div className="g-col text-right">
                  <span className="g-label">Mục tiêu</span>
                   <span className="g-amount text-muted">{formatCurrency(goal.target)} đ</span>
                </div>
              </div>
              
              <button className="btn-add-money" onClick={() => {
                setSelectedGoal(goal);
                setShowTopUpModal(true);
              }}>
                Nạp thêm tiền
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Quỹ */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Thêm quỹ mới</h3>
              <X onClick={() => setShowAddModal(false)} cursor="pointer" />
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label>Tên quỹ</label>
                <input 
                  type="text" 
                  value={newGoal.title} 
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Ví dụ: Mua iPhone, Du lịch..."
                  required
                />
              </div>
               <div className="form-group">
                <label>Số tiền mục tiêu</label>
                <input 
                  type="text" 
                  value={newGoal.target} 
                  onChange={e => setNewGoal({...newGoal, target: formatInput(e.target.value)})}
                  placeholder="Nhập số tiền..."
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Biểu tượng (Icon)</label>
                  <input 
                    type="text" 
                    value={newGoal.icon} 
                    onChange={e => setNewGoal({...newGoal, icon: e.target.value})}
                    placeholder="Emoji..."
                  />
                </div>
                <div className="form-group">
                  <label>Màu sắc</label>
                  <input 
                    type="color" 
                    value={newGoal.color} 
                    onChange={e => setNewGoal({...newGoal, color: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="primary-btn mt-4">Tạo quỹ</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nạp Tiền */}
      {showTopUpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nạp thêm: {selectedGoal.title}</h3>
              <X onClick={() => setShowTopUpModal(false)} cursor="pointer" />
            </div>
            <form onSubmit={handleTopUp}>
               <div className="form-group">
                <label>Số tiền nạp vào</label>
                <input 
                  type="text" 
                  value={topUpAmount} 
                  onChange={e => setTopUpAmount(formatInput(e.target.value))}
                  placeholder="Nhập số tiền..."
                  required
                />
              </div>
              <button type="submit" className="primary-btn mt-4">Xác nhận nạp</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingGoals;
