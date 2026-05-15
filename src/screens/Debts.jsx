import React, { useState, useEffect } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import './Debts.css';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const markAsPaid = async (id) => {
    try {
      const res = await fetch(`/api/splits/${id}/pay`, { method: 'PATCH' });
      if (res.ok) {
        fetchDebts();
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
    }
  };

  if (loading) return <div className="screen-container">Đang tải...</div>;

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="screen-container">
      <div className="debt-summary card mb-6">
        <span className="debt-label">Tổng số tiền cần thu</span>
        <h2 className="debt-total">{totalDebt.toLocaleString()} đ</h2>
      </div>

      <div className="debts-list">
        <h3>Danh sách nợ</h3>
        {debts.length === 0 ? (
          <div className="empty-state mt-4">
            <p>Hiện không có ai nợ bạn 😊</p>
          </div>
        ) : (
          debts.map(debt => (
            <div key={debt.id} className="card debt-card">
              <div className="debt-info">
                <div className="debt-user-icon">
                  <User size={20} />
                </div>
                <div className="debt-details">
                  <h4 className="debt-person">{debt.person_name}</h4>
                  <p className="debt-transaction text-muted">{debt.transaction_title}</p>
                  <p className="debt-date">{debt.date}</p>
                </div>
              </div>
              <div className="debt-actions">
                <span className="debt-amount">+{debt.amount.toLocaleString()} đ</span>
                <button 
                  className="btn-pay" 
                  onClick={() => markAsPaid(debt.id)}
                  title="Đã nhận tiền"
                >
                  <CheckCircle2 size={24} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Debts;
