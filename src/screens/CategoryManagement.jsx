import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { addToast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  
  // Form states
  const [formData, setFormData] = useState({ label: '', color: '#10B981', type: 'expense', icon: '📦' });

  const iconPresets = [
    '🍔', '🍕', '🍜', '☕', '🥦', '🍦', // Ăn uống
    '🏠', '⚡', '💧', '📶', '🧺', '🧹', // Nhà cửa
    '🚗', '🛵', '🚲', '✈️', '⛽', '🎫', // Di chuyển
    '🛍️', '👗', '💇', '💄', '💍', '👟', // Mua sắm
    '🏥', '💊', '🏋️', '🧘', '🦷', '🕶️', // Sức khỏe
    '🎮', '🎬', '🎧', '🎤', '🎨', '📸', // Giải trí
    '💰', '💵', '🧧', '🎁', '📈', '🐖', // Tiền bạc
    '🐶', '🐱', '🌵', '🎓', '🛠️', '📦'  // Khác
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label) return;

    try {
      let res;
      if (editingId) {
        res = await updateCategory(editingId, formData);
        if (res.ok) addToast('Đã cập nhật danh mục', 'success');
      } else {
        res = await addCategory(formData);
        if (res.ok) addToast('Đã thêm danh mục mới', 'success');
      }

      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setShowIconPicker(false);
        setFormData({ label: '', color: '#10B981', type: 'expense', icon: '📦' });
      } else {
        const data = await res.json();
        addToast(data.error || 'Lỗi khi lưu danh mục', 'error');
      }
    } catch (err) {
      addToast('Lỗi kết nối', 'error');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ label: cat.label, color: cat.color, type: cat.type, icon: cat.icon || '📦' });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteAction = async () => {
    const id = confirmDelete.id;
    const res = await deleteCategory(id);
    if (res.ok) {
      addToast('Đã xóa danh mục', 'info');
    } else {
      const data = await res.json();
      addToast(data.error || 'Không thể xóa', 'error');
    }
    setConfirmDelete({ isOpen: false, id: null });
  };

  return (
    <div className="screen-container">
      <div className="flex-between mb-6 mt-4">
        <h2>Quản lý danh mục</h2>
        <button className="add-goal-btn" onClick={() => {
          setEditingId(null);
          setFormData({ label: '', color: '#10B981', type: 'expense' });
          setShowAddModal(true);
        }}>
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      <div className="category-sections">
        <div className="category-section mb-8">
          <h3 className="section-title mb-4">Danh mục Chi tiêu (-)</h3>
          <div className="category-grid">
            {categories.filter(c => c.type === 'expense').map(cat => (
              <div key={cat.id} className="category-item-card card">
                <div className="cat-icon-display" style={{backgroundColor: cat.color + '20', color: cat.color}}>
                  {cat.icon || '📦'}
                </div>
                <span className="cat-label">{cat.label}</span>
                <div className="cat-actions">
                  <Edit2 size={16} onClick={() => handleEdit(cat)} />
                  <Trash2 size={16} onClick={() => handleDelete(cat.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="category-section">
          <h3 className="section-title mb-4">Danh mục Thu nhập (+)</h3>
          <div className="category-grid">
            {categories.filter(c => c.type === 'income').map(cat => (
              <div key={cat.id} className="category-item-card card">
                <div className="cat-icon-display" style={{backgroundColor: cat.color + '20', color: cat.color}}>
                  {cat.icon || '📦'}
                </div>
                <span className="cat-label">{cat.label}</span>
                <div className="cat-actions">
                  <Edit2 size={16} onClick={() => handleEdit(cat)} />
                  <Trash2 size={16} onClick={() => handleDelete(cat.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <X onClick={() => setShowAddModal(false)} cursor="pointer" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên danh mục</label>
                <input 
                  type="text" 
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  placeholder="Ví dụ: Nuôi mèo, Sửa xe..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Loại</label>
                  <div className="type-toggle mini">
                    <button 
                      type="button"
                      className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                      onClick={() => setFormData({...formData, type: 'expense'})}
                    >Chi tiêu</button>
                    <button 
                      type="button"
                      className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                      onClick={() => setFormData({...formData, type: 'income'})}
                    >Thu nhập</button>
                  </div>
                </div>

                <div className="form-group" style={{position: 'relative'}}>
                  <label>Biểu tượng</label>
                  <div className={`icon-selector-trigger ${showIconPicker ? 'active' : ''}`} onClick={() => setShowIconPicker(!showIconPicker)}>
                    {formData.icon}
                  </div>
                  {showIconPicker && (
                    <div className="icon-presets-dropdown card animate-fadeIn">
                      {iconPresets.map(icon => (
                        <div 
                          key={icon} 
                          className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                          onClick={() => {
                            setFormData({...formData, icon});
                            setShowIconPicker(false);
                          }}
                        >
                          {icon}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Màu sắc hiển thị</label>
                <div className="color-presets">
                  {['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#06B6D4'].map(color => (
                    <div 
                      key={color} 
                      className={`color-preset ${formData.color === color ? 'active' : ''}`}
                      style={{backgroundColor: color}}
                      onClick={() => setFormData({...formData, color})}
                    >
                      {formData.color === color && <Check size={14} color="white" />}
                    </div>
                  ))}
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="custom-color-picker"
                  />
                </div>
              </div>
              <button type="submit" className="primary-btn mt-4">
                {editingId ? 'Cập nhật' : 'Tạo ngay'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này có thể ảnh hưởng đến cách hiển thị giao dịch cũ."
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default CategoryManagement;
