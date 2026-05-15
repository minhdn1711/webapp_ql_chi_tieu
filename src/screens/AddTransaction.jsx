import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { AlertCircle } from 'lucide-react';
import './AddTransaction.css';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('shared');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }
    if (!categoryId) {
      setError('Vui lòng chọn danh mục.');
      return;
    }

    // Default title if not provided
    let finalTitle = title.trim();
    if (!finalTitle) {
      const selectEl = e.target.querySelector('select');
      finalTitle = selectEl.options[selectEl.selectedIndex].text;
    }

    const newTransaction = {
      date,
      title: finalTitle,
      amount: Number(amount),
      type,
      categoryId,
      by: paidBy
    };

    addTransaction(newTransaction);
    navigate('/');
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); // Reset category when type changes
  };

  return (
    <div className="screen-container">
      <div className="type-toggle mb-6">
        <button 
          className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => handleTypeChange('expense')}
          type="button"
        >
          Khoản Chi
        </button>
        <button 
          className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => handleTypeChange('income')}
          type="button"
        >
          Khoản Thu
        </button>
      </div>

      {error && (
        <div className="error-message mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-group">
          <label className="form-label">Số tiền (đ) *</label>
          <input 
            type="number" 
            className="form-input amount-input" 
            placeholder="0" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Danh mục *</label>
          <select 
            className="form-select" 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="" disabled>Chọn danh mục...</option>
            {type === 'expense' ? (
              <>
                <option value="food">Ăn uống / Đi chợ</option>
                <option value="rent">Tiền nhà</option>
                <option value="utilities">Điện nước</option>
                <option value="transport">Di chuyển</option>
                <option value="shopping">Mua sắm</option>
                <option value="appliances">Gia dụng</option>
                <option value="savings">Tiết kiệm</option>
                <option value="other">Khác</option>
              </>
            ) : (
              <>
                <option value="salary">Lương</option>
                <option value="bonus">Thưởng</option>
                <option value="gift">Được tặng</option>
                <option value="other">Khác</option>
              </>
            )}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Người chi/thu</label>
          <div className="radio-group">
            <label className={`radio-pill ${paidBy === 'me' ? 'active' : ''}`}>
              <input type="radio" name="paidBy" value="me" checked={paidBy === 'me'} onChange={() => setPaidBy('me')} />
              Tôi
            </label>
            <label className={`radio-pill ${paidBy === 'partner' ? 'active' : ''}`}>
              <input type="radio" name="paidBy" value="partner" checked={paidBy === 'partner'} onChange={() => setPaidBy('partner')} />
              Vợ/Chồng
            </label>
            <label className={`radio-pill ${paidBy === 'shared' ? 'active' : ''}`}>
              <input type="radio" name="paidBy" value="shared" checked={paidBy === 'shared'} onChange={() => setPaidBy('shared')} />
              Quỹ chung
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ngày giao dịch *</label>
          <input 
            type="date" 
            className="form-input" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group mb-6">
          <label className="form-label">Ghi chú (Tùy chọn)</label>
          <textarea 
            className="form-input" 
            rows="2" 
            placeholder="Mô tả thêm..." 
            style={{resize: 'none'}}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="btn-primary">Lưu giao dịch</button>
      </form>
    </div>
  );
};

export default AddTransaction;
