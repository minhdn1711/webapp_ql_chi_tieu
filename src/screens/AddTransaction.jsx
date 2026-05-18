import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { formatInput, getRawAmount } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../context/CategoryContext';
import { Link } from 'react-router-dom';
import './AddTransaction.css';

const AddTransaction = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addTransaction, updateTransaction } = useTransactions();
  const { addToast } = useToast();
  const { categories } = useCategories();
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('shared');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');

  // Keyword to category mapping
  const keywordMap = {
    'ăn': '1', 'uống': '1', 'phở': '1', 'cơm': '1', 'cafe': '1', 'coffee': '1', 'bún': '1',
    'nhà': '2', 'trọ': '2', 'điện': '3', 'nước': '3', 'internet': '3', 'wifi': '3', 'rác': '3',
    'xăng': '4', 'grab': '4', 'be': '4', 'taxi': '4', 'xe': '4',
    'vay': '5', 'mượn': '5', 'nợ': '5',
    'áo': '6', 'quần': '6', 'giày': '6', 'shopee': '6', 'lazada': '6', 'tiki': '6'
  };
  
  // Split bill states
  const [isSplit, setIsSplit] = useState(false);
  const [splitPeople, setSplitPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  // Participants to include in equal split
  const [includeMe, setIncludeMe] = useState(true);
  const [includeWife, setIncludeWife] = useState(false);
  const [includeHusband, setIncludeHusband] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(isEdit);

  // Fetch data if in edit mode
  React.useEffect(() => {
    if (isEdit && id) {
      fetch(`/api/transactions/${id}`)
        .then(res => res.json())
        .then(data => {
          setType(data.type);
          setAmount(formatInput(data.amount));
          setCategoryId(data.categoryId);
          setPaidBy(data.by);
          setDate(data.date);
          setTitle(data.title);
          if (data.splits && data.splits.length > 0) {
            setIsSplit(true);
            setSplitPeople(data.splits.map(p => ({ 
              name: p.name, 
              amount: formatInput(p.amount) 
            })));
          }
          setIsLoading(false);
        })
        .catch(err => {
          addToast('Không thể tải thông tin giao dịch', 'error');
          navigate('/transactions');
        });
    }
  }, [isEdit, id, navigate, addToast]);

  // Handle category change with auto-detection for loans
  const handleCategoryChange = (val) => {
    if (val === null || val === undefined) return;
    setCategoryId(val);
    const selectedCat = (categories || []).find(c => c.id && c.id.toString() === val.toString());
    if (selectedCat && selectedCat.label === 'Cho vay') {
      setIsSplit(true);
      setIncludeMe(false);
      setIncludeWife(false);
      setIncludeHusband(false);
    }
  };

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
    if (!rawAmt) return;
    
    const participantsCount = (includeMe ? 1 : 0) + (includeWife ? 1 : 0) + (includeHusband ? 1 : 0) + splitPeople.length;
    if (participantsCount === 0) return;

    const splitAmount = Math.floor(rawAmt / participantsCount);
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
      if (totalSplit > rawAmount) {
        setError('Tổng số tiền chia sẻ cho người khác không được lớn hơn tổng số tiền chi.');
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
      const catIdStr = categoryId !== null && categoryId !== undefined ? categoryId.toString() : '';
      const selectedCat = (categories || []).find(c => c.id && c.id.toString() === catIdStr);
      finalTitle = selectedCat ? selectedCat.label : 'Giao dịch';
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

    const handleSave = async () => {
      let res;
      if (isEdit) {
        res = await updateTransaction(id, newTransaction);
        if (res.ok) addToast('Đã cập nhật giao dịch!', 'success');
      } else {
        res = await addTransaction(newTransaction);
        if (res.ok) addToast('Đã thêm giao dịch mới!', 'success');
      }
      
      if (res.ok) navigate(isEdit ? '/transactions' : '/');
    };

    handleSave();
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategoryId(''); // Reset category when type changes
  };

  if (isLoading) return (
    <div className="screen-container flex-center" style={{height: '60vh'}}>
      <Loader2 className="animate-spin" size={32} color="var(--primary-green)" />
    </div>
  );

  return (
    <div className="screen-container">
      <h2 className="mb-4">{isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
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
          <div className="flex-between mb-2">
            <label className="form-label" style={{marginBottom: 0}}>Danh mục *</label>
            <Link to="/categories" className="text-link" style={{fontSize: '12px'}}>Quản lý</Link>
          </div>
          <select 
            className="form-select" 
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="" disabled>Chọn danh mục...</option>
            {categories.filter(c => c.type === type).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
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
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              // Auto-detect category from keywords
              if (!categoryId) {
                const words = val.toLowerCase().split(' ');
                for (const word of words) {
                  if (keywordMap[word]) {
                    handleCategoryChange(keywordMap[word]);
                    break;
                  }
                }
              }
            }}
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

                <div className="participants-selector mb-4">
                  <p className="text-muted mb-2" style={{fontSize: '13px'}}>Bao gồm trong chia đều:</p>
                  <div className="flex-row gap-2">
                    <label className={`participant-chip ${includeMe ? 'active' : ''}`}>
                      <input type="checkbox" checked={includeMe} onChange={() => setIncludeMe(!includeMe)} />
                      Tôi
                    </label>
                    <label className={`participant-chip ${includeWife ? 'active' : ''}`}>
                      <input type="checkbox" checked={includeWife} onChange={() => setIncludeWife(!includeWife)} />
                      Vợ
                    </label>
                    <label className={`participant-chip ${includeHusband ? 'active' : ''}`}>
                      <input type="checkbox" checked={includeHusband} onChange={() => setIncludeHusband(!includeHusband)} />
                      Chồng
                    </label>
                  </div>
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

        <button type="submit" className="btn-primary">
          {isEdit ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
