import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { AlertCircle, X } from 'lucide-react';
import { formatInput, getRawAmount } from '../utils/format';
import { useToast } from '../context/ToastContext';
import './AddTransaction.css';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { addToast } = useToast();
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('shared');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  
  // Split bill states
  const [isSplit, setIsSplit] = useState(false);
  const [splitPeople, setSplitPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  const [error, setError] = useState('');

  const addPerson = () => {
    if (newPersonName.trim()) {
      setSplitPeople([...splitPeople, { name: newPersonName.trim(), amount: '' }]);
      setNewPersonName('');
    }
  };

  const removePerson = (index) => {
    setSplitPeople(splitPeople.filter((_, i) => i !== index));
  };

  const updateSplitAmount = (index, val) => {
    const newPeople = [...splitPeople];
    newPeople[index].amount = formatInput(val);
    setSplitPeople(newPeople);
  };

  const autoSplit = () => {
    const rawAmt = getRawAmount(amount);
    if (!rawAmt || splitPeople.length === 0) return;
    const splitAmount = Math.floor(rawAmt / (splitPeople.length + 1));
    const newPeople = splitPeople.map(p => ({ ...p, amount: formatInput(splitAmount) }));
    setSplitPeople(newPeople);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const rawAmount = getRawAmount(amount);
    if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }

    if (isSplit) {
      const totalSplit = splitPeople.reduce((sum, p) => sum + getRawAmount(p.amount), 0);
      if (totalSplit >= rawAmount) {
        setError('Tổng số tiền chia sẻ cho người khác phải nhỏ hơn tổng số tiền chi.');
        return;
      }
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
      amount: rawAmount,
      type,
      categoryId,
      by: paidBy,
      splits: isSplit ? splitPeople.map(p => ({ 
        name: p.name, 
        amount: getRawAmount(p.amount) 
      })) : null
    };

    addTransaction(newTransaction);
    addToast('Đã thêm giao dịch mới!', 'success');
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
            type="text" 
            className="form-input amount-input" 
            placeholder="0" 
            value={amount}
            onChange={(e) => setAmount(formatInput(e.target.value))}
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

        {type === 'expense' && (
          <div className="split-bill-section mb-6">
            <div className="flex-between mb-4">
              <label className="form-label" style={{marginBottom: 0}}>Chia tiền cho bạn bè</label>
              <div 
                className={`toggle-switch ${isSplit ? 'active' : ''}`}
                onClick={() => setIsSplit(!isSplit)}
              >
                <div className="switch-handle"></div>
              </div>
            </div>

            {isSplit && (
              <div className="split-details animate-fadeIn">
                <div className="add-person-row mb-4">
                  <input 
                    type="text" 
                    placeholder="Tên người nợ..." 
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  />
                  <button type="button" onClick={addPerson} className="btn-add-person">Thêm</button>
                </div>

                {splitPeople.length > 0 && (
                  <>
                    <div className="split-list mb-4">
                      {splitPeople.map((person, index) => (
                        <div key={index} className="split-item mb-2">
                          <span>{person.name}</span>
                          <div className="split-input-wrapper">
                            <input 
                              type="text" 
                              placeholder="Số tiền..." 
                              value={person.amount}
                              onChange={(e) => updateSplitAmount(index, e.target.value)}
                            />
                            <X size={16} onClick={() => removePerson(index)} className="remove-icon" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={autoSplit} className="btn-secondary w-full mb-4">Chia đều tất cả</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary">Lưu giao dịch</button>
      </form>
    </div>
  );
};

export default AddTransaction;
