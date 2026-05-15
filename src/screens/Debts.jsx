import React, { useState, useEffect } from 'react';
import { User, Clock, CheckCircle, X } from 'lucide-react';
import './Debts.css';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const fetchDebts = async () => {
    try {
      const res = await fetch('/api/debts');
      const data = await res.json();
      setDebts(data);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu nợ:', err);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || !selectedDebt) return;

    try {
      const res = await fetch(`/api/splits/${selectedDebt.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(payAmount) })
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayAmount('');
        fetchDebts();
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
    }
  };

  if (loading) return <div className="screen-container">Đang tải...</div>;

  const unpaidDebts = debts.filter(d => d.is_paid === 0);
  const paidDebts = debts.filter(d => d.is_paid === 1);
  const totalUnpaid = unpaidDebts.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

  const displayedDebts = activeTab === 'unpaid' ? unpaidDebts : paidDebts;

  return (
    <div className="screen-container">
      <div className="debt-summary card mb-6">
        <span className="debt-label">Tổng nợ còn lại</span>
        <h2 className="debt-total">{totalUnpaid.toLocaleString()} đ</h2>
      </div>

      <div className="tabs-container mb-4">
        <button 
          className={`tab-btn ${activeTab === 'unpaid' ? 'active' : ''}`}
          onClick={() => setActiveTab('unpaid')}
        >
          <Clock size={16} />
          Đang nợ ({unpaidDebts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          <CheckCircle size={16} />
          Đã trả xong ({paidDebts.length})
        </button>
      </div>

      <div className="debts-list">
        {displayedDebts.length === 0 ? (
          <div className="empty-state mt-4">
            <p>{activeTab === 'unpaid' ? 'Hiện không có ai nợ bạn 😊' : 'Chưa có lịch sử thanh toán.'}</p>
          </div>
        ) : (
          displayedDebts.map(debt => {
            const remaining = debt.amount - debt.paid_amount;
            const progress = Math.round((debt.paid_amount / debt.amount) * 100);
            
            return (
              <div key={debt.id} className={`card debt-card ${debt.is_paid ? 'paid' : ''}`}>
                <div className="debt-main-info">
                  <div className="debt-info">
                    <div className="debt-user-icon">
                      <User size={20} />
                    </div>
                    <div className="debt-details">
                      <h4 className="debt-person">{debt.person_name}</h4>
                      <p className="debt-transaction text-muted">{debt.transaction_title}</p>
                    </div>
                  </div>
                  <div className="debt-amount-info">
                    <span className="debt-remaining">{remaining.toLocaleString()} đ</span>
                    <p className="debt-total-label text-muted">/{debt.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="debt-progress-wrapper mt-3">
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: 'var(--primary-green)' }}></div>
                  </div>
                  <div className="flex-between mt-1">
                    <span className="text-muted" style={{fontSize: '11px'}}>Đã trả: {debt.paid_amount.toLocaleString()} đ</span>
                    <span className="text-muted" style={{fontSize: '11px'}}>{progress}%</span>
                  </div>
                </div>

                {debt.is_paid === 0 && (
                  <button 
                    className="btn-pay-action mt-3" 
                    onClick={() => {
                      setSelectedDebt(debt);
                      setPayAmount(remaining);
                      setShowPayModal(true);
                    }}
                  >
                    Xác nhận nhận tiền
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nhập Tiền Trả */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nhận tiền từ: {selectedDebt.person_name}</h3>
              <X onClick={() => setShowPayModal(false)} cursor="pointer" />
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Số tiền nhận được (đ)</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  max={selectedDebt.amount - selectedDebt.paid_amount}
                  required
                />
                <p className="text-muted mt-2" style={{fontSize: '12px'}}>
                  Nợ còn lại: {(selectedDebt.amount - selectedDebt.paid_amount).toLocaleString()} đ
                </p>
              </div>
              <button type="submit" className="primary-btn mt-4">Xác nhận & Lưu khoản thu</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
