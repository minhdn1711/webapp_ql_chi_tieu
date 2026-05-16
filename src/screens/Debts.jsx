import React, { useState, useEffect, useMemo } from 'react';
import { User, Clock, CheckCircle, X, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Debts.css';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [expandedPerson, setExpandedPerson] = useState(null);
  const { addToast } = useToast();

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
        addToast(`Đã nhận ${parseInt(payAmount).toLocaleString()} đ từ ${selectedDebt.person_name}`);
        setShowPayModal(false);
        setPayAmount('');
        fetchDebts();
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
    }
  };

  // Group debts by person
  const groupedDebts = useMemo(() => {
    const filtered = debts.filter(d => activeTab === 'unpaid' ? d.is_paid === 0 : d.is_paid === 1);

    const groups = filtered.reduce((acc, curr) => {
      const name = curr.person_name;
      if (!acc[name]) {
        acc[name] = {
          name,
          totalAmount: 0,
          totalPaid: 0,
          items: []
        };
      }
      acc[name].totalAmount += curr.amount;
      acc[name].totalPaid += curr.paid_amount;
      acc[name].items.push(curr);
      
      // Calculate group percentage
      acc[name].percent = Math.round((acc[name].totalPaid / acc[name].totalAmount) * 100);
      
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => (b.totalAmount - b.totalPaid) - (a.totalAmount - a.totalPaid));
  }, [debts, activeTab]);

  if (loading) return <div className="screen-container">Đang tải...</div>;

  const totalUnpaid = debts
    .filter(d => d.is_paid === 0)
    .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

  return (
    <div className="screen-container">
      <div className="debt-summary card mb-6">
        <span className="debt-label">Tổng nợ còn lại</span>
        <h2 className="debt-total">{totalUnpaid.toLocaleString()} đ</h2>
      </div>

      <div className="tabs-container mb-4">
        <button
          className={`tab-btn ${activeTab === 'unpaid' ? 'active' : ''}`}
          onClick={() => { setActiveTab('unpaid'); setExpandedPerson(null); }}
        >
          <Clock size={16} />
          Đang nợ ({debts.filter(d => d.is_paid === 0).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => { setActiveTab('paid'); setExpandedPerson(null); }}
        >
          <CheckCircle size={16} />
          Đã trả xong ({debts.filter(d => d.is_paid === 1).length})
        </button>
      </div>

      <div className="debts-list">
        {groupedDebts.length === 0 ? (
          <div className="empty-state mt-4">
            <p>{activeTab === 'unpaid' ? 'Hiện không có ai nợ bạn 😊' : 'Chưa có lịch sử thanh toán.'}</p>
          </div>
        ) : (
          groupedDebts.map(group => {
            const isExpanded = expandedPerson === group.name;
            const groupRemaining = group.totalAmount - group.totalPaid;

            return (
              <div key={group.name} className="person-group-card card mb-3">
                <div
                  className="person-header flex-between"
                  onClick={() => setExpandedPerson(isExpanded ? null : group.name)}
                >
                  <div className="flex-row gap-3">
                    <div className="debt-user-icon">
                      <User size={20} />
                    </div>
                    <div className="flex-col gap-1" style={{ marginLeft: '10px' }}>
                      <h4 className="person-name">{group.name}</h4>
                      <p className="text-muted" style={{ fontSize: '12px' }}>{group.items.length} khoản nợ</p>
                    </div>
                  </div>
                  <div className="text-right flex-row gap-2">
                    <div className="group-total-info">
                      <span className="debt-remaining">{groupRemaining.toLocaleString()} đ</span>
                      <div className="group-percent-tag">
                        <TrendingUp size={10} />
                        {group.percent}%
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="debt-details-list mt-4 animate-fadeIn">
                    {group.items.map(debt => {
                      const remaining = debt.amount - debt.paid_amount;
                      const progress = Math.round((debt.paid_amount / debt.amount) * 100);

                      return (
                        <div key={debt.id} className="debt-detail-item mb-4">
                          <div className="flex-between mb-2">
                            <div>
                              <p className="debt-transaction-title">{debt.transaction_title}</p>
                              <p className="text-muted" style={{ fontSize: '11px' }}>{debt.date}</p>
                            </div>
                             <div className="text-right">
                               <span className="detail-remaining">{debt.paid_amount.toLocaleString()} đ</span>
                               <p className="text-muted" style={{ fontSize: '11px' }}>
                                 /{debt.amount.toLocaleString()}
                               </p>
                             </div>
                          </div>

                          <div className="progress-bg mb-2">
                            <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: 'var(--primary-green)' }}></div>
                          </div>

                          <div className="flex-between mt-2">
                            {debt.is_paid === 0 ? (
                              <button
                                className="btn-pay-mini"
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setPayAmount(remaining);
                                  setShowPayModal(true);
                                }}
                              >
                                Trả tiền
                              </button>
                            ) : <div></div>}
                            <span className="text-muted" style={{ fontSize: '12px', fontWeight: '600' }}>{progress}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                <p className="text-muted mt-2" style={{ fontSize: '12px' }}>
                  Khoản nợ này còn: {(selectedDebt.amount - selectedDebt.paid_amount).toLocaleString()} đ
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
