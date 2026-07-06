import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { formatCurrency, formatInput, getRawAmount, getToday } from '../utils/format';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './SavingGoals.css';

const SavingGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [goalNotes, setGoalNotes] = useState({});
  const { addToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [confirmDeleteNote, setConfirmDeleteNote] = useState({ isOpen: false, goalId: null, noteId: null });
  const [showIconPicker, setShowIconPicker] = useState(false);

  const iconPresets = [
    '💰', '💵', '🧧', '🎁', '📈', '🐖',
    '🏠', '🚗', '🛵', '✈️', '💍', '🎓',
    '🍔', '☕', '🎮', '🎬', '🎧', '🎸',
    '🏥', '💊', '🏋️', '🧘', '🚲', '👟',
    '🐶', '🐱', '🌵', '🛠️', '📦', '📱'
  ];

  const [newGoal, setNewGoal] = useState({ title: '', target: '', icon: '💰', color: '#10B981' });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [newNote, setNewNote] = useState({ title: '', amount: '', date: getToday() });

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

  const fetchNotes = async (goalId) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/notes`);
      const data = await res.json();
      setGoalNotes(prev => ({ ...prev, [goalId]: data }));
    } catch (err) {
      console.error('Lỗi lấy hạng mục:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const toggleExpand = (goalId) => {
    const isExpanding = !expandedGoals[goalId];
    setExpandedGoals(prev => ({ ...prev, [goalId]: isExpanding }));
    if (isExpanding && !goalNotes[goalId]) {
      fetchNotes(goalId);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newGoal, target: getRawAmount(newGoal.target) })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewGoal({ title: '', target: '', icon: '💰', color: '#10B981' });
        setShowIconPicker(false);
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

  const handleAddNote = async (e) => {
    e.preventDefault();
    const amount = getRawAmount(newNote.amount);
    if (amount <= 0) {
      addToast('Số tiền phải lớn hơn 0', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNote.title, amount, date: newNote.date })
      });
      if (res.ok) {
        setShowNoteModal(false);
        setNewNote({ title: '', amount: '', date: getToday() });
        addToast('Đã ghi hạng mục!', 'success');
        fetchGoals();
        fetchNotes(selectedGoal.id);
      }
    } catch (err) {
      console.error('Lỗi thêm hạng mục:', err);
    }
  };

  const handleDeleteGoal = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteAction = async () => {
    const id = confirmDelete.id;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Đã xóa quỹ tiết kiệm', 'info');
        fetchGoals();
      }
    } catch (err) {
      console.error('Lỗi xóa quỹ:', err);
    }
    setConfirmDelete({ isOpen: false, id: null });
  };

  const handleDeleteNote = (goalId, noteId) => {
    setConfirmDeleteNote({ isOpen: true, goalId, noteId });
  };

  const confirmDeleteNoteAction = async () => {
    const { goalId, noteId } = confirmDeleteNote;
    try {
      const res = await fetch(`/api/goals/${goalId}/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Đã xóa hạng mục, tiền hoàn lại vào quỹ', 'info');
        fetchGoals();
        fetchNotes(goalId);
      }
    } catch (err) {
      console.error('Lỗi xóa hạng mục:', err);
    }
    setConfirmDeleteNote({ isOpen: false, goalId: null, noteId: null });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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
          const isExpanded = expandedGoals[goal.id];
          const notes = goalNotes[goal.id] || [];
          const totalSpent = notes.reduce((sum, n) => sum + n.amount, 0);

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

              <div className="goal-actions-row">
                <button className="btn-add-money" onClick={() => {
                  setSelectedGoal(goal);
                  setShowTopUpModal(true);
                }}>
                  Nạp thêm tiền
                </button>
                <button className="btn-add-note" onClick={() => {
                  setSelectedGoal(goal);
                  setShowNoteModal(true);
                }}>
                  <FileText size={14} />
                  Ghi hạng mục
                </button>
              </div>

              {/* Toggle hạng mục */}
              <button className="btn-toggle-notes" onClick={() => toggleExpand(goal.id)}>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isExpanded ? 'Ẩn hạng mục' : `Xem hạng mục${notes.length > 0 ? ` (${notes.length})` : ''}`}
              </button>

              {isExpanded && (
                <div className="notes-section">
                  {notes.length === 0 ? (
                    <p className="notes-empty">Chưa có hạng mục nào. Nhấn "Ghi hạng mục" để thêm.</p>
                  ) : (
                    <>
                      <div className="notes-list">
                        {notes.map(note => (
                          <div key={note.id} className="note-item">
                            <div className="note-info">
                              <span className="note-title">{note.title}</span>
                              <span className="note-date">{formatDate(note.date)}</span>
                            </div>
                            <div className="note-right">
                              <span className="note-amount">-{formatCurrency(note.amount)} đ</span>
                              <button className="btn-delete-note" onClick={() => handleDeleteNote(goal.id, note.id)} title="Xóa hạng mục">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="notes-summary">
                        <span>Tổng đã chi từ quỹ</span>
                        <span className="notes-total">-{formatCurrency(totalSpent)} đ</span>
                      </div>
                    </>
                  )}
                </div>
              )}
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
                  onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Ví dụ: Mua iPhone, Du lịch..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Số tiền mục tiêu</label>
                <input
                  type="text"
                  value={newGoal.target}
                  onChange={e => setNewGoal({ ...newGoal, target: formatInput(e.target.value) })}
                  placeholder="Nhập số tiền..."
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Biểu tượng (Icon)</label>
                  <div style={{ marginTop: '10px' }} className={`icon-selector-trigger ${showIconPicker ? 'active' : ''}`} onClick={() => setShowIconPicker(!showIconPicker)}>
                    {newGoal.icon}
                  </div>
                  {showIconPicker && (
                    <div className="icon-presets-dropdown card animate-fadeIn" style={{ right: 'auto', left: 0 }}>
                      {iconPresets.map(icon => (
                        <div
                          key={icon}
                          className={`icon-option ${newGoal.icon === icon ? 'active' : ''}`}
                          onClick={() => {
                            setNewGoal({ ...newGoal, icon });
                            setShowIconPicker(false);
                          }}
                        >
                          {icon}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group flex-1">
                  <label>Màu sắc</label>
                  <div className="color-presets" style={{ marginTop: '10px' }}>
                    {['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                      <div
                        key={color}
                        className={`color-preset ${newGoal.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color, width: '24px', height: '24px' }}
                        onClick={() => setNewGoal({ ...newGoal, color })}
                      ></div>
                    ))}
                    <input
                      type="color"
                      value={newGoal.color}
                      onChange={e => setNewGoal({ ...newGoal, color: e.target.value })}
                      className="custom-color-picker"
                      style={{ width: '24px', height: '24px' }}
                    />
                  </div>
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

      {/* Modal Ghi Hạng Mục */}
      {showNoteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ghi hạng mục: {selectedGoal.title}</h3>
              <X onClick={() => {
                setShowNoteModal(false);
                setNewNote({ title: '', amount: '', date: getToday() });
              }} cursor="pointer" />
            </div>
            <p className="note-modal-hint">Số tiền sẽ được trừ trực tiếp từ quỹ này.</p>
            <form onSubmit={handleAddNote}>
              <div className="form-group">
                <label>Tên hạng mục</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Ví dụ: Mua vé máy bay, Đặt khách sạn..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Số tiền</label>
                <input
                  type="text"
                  value={newNote.amount}
                  onChange={e => setNewNote({ ...newNote, amount: formatInput(e.target.value) })}
                  placeholder="Nhập số tiền..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày</label>
                <input
                  type="date"
                  value={newNote.date}
                  onChange={e => setNewNote({ ...newNote, date: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="primary-btn mt-4">Ghi hạng mục</button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Xóa quỹ tiết kiệm"
        message="Bạn có chắc chắn muốn xóa quỹ tiết kiệm này? Dữ liệu sẽ không thể khôi phục."
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      <ConfirmModal
        isOpen={confirmDeleteNote.isOpen}
        title="Xóa hạng mục"
        message="Xóa hạng mục này sẽ hoàn trả số tiền về quỹ. Bạn có chắc không?"
        onConfirm={confirmDeleteNoteAction}
        onCancel={() => setConfirmDeleteNote({ isOpen: false, goalId: null, noteId: null })}
      />
    </div>
  );
};

export default SavingGoals;
