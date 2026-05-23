import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Lock, User, Check, KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './SettingsModal.css';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jude',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leah',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Loki',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Coco',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster'
];

const SettingsModal = ({ isOpen, onClose, currentProfile, onProfileUpdate, onLockApp }) => {
  const { addToast } = useToast();
  
  // Profile state
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync profile data when modal opens
  useEffect(() => {
    if (currentProfile) {
      setUsername(currentProfile.username || 'Gia Đình Nhỏ');
      setSelectedAvatar(currentProfile.avatar || PRESET_AVATARS[0]);
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleAvatarSelect = (url) => {
    setSelectedAvatar(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast('Ảnh vượt quá dung lượng 8MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAvatar(reader.result); // Base64 representation
      addToast('Tải ảnh đại diện thành công!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      addToast('Tên người dùng không được để trống!', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar: selectedAvatar })
      });
      const data = await response.json();

      if (data.success) {
        addToast('Cập nhật hồ sơ thành công!', 'success');
        onProfileUpdate({ username, avatar: selectedAvatar });
        
        // Handle password change if filled
        if (showPasswordChange && currentPassword && newPassword) {
          await handleSavePassword();
        } else {
          onClose();
        }
      } else {
        addToast(data.error || 'Cập nhật thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp!', 'error');
      throw new Error('Mismatched password');
    }

    if (newPassword.length < 4) {
      addToast('Mật khẩu mới phải từ 4 ký tự trở lên!', 'error');
      throw new Error('Password too short');
    }

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();

      if (data.success) {
        addToast('Đổi mật khẩu thành công!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChange(false);
        onClose();
      } else {
        addToast(data.error || 'Mật khẩu cũ không chính xác!', 'error');
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Cài Đặt & Bảo Mật</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-body">
          {/* Avatar selector & preview */}
          <div className="avatar-preview-section">
            <div className="settings-avatar-wrapper" onClick={triggerFileInput} title="Nhấp để tải ảnh lên">
              <img 
                src={selectedAvatar} 
                alt="Profile Preview" 
                className="settings-avatar-preview"
                onError={(e) => {
                  e.target.src = PRESET_AVATARS[0];
                }}
              />
              <div className="avatar-upload-icon">
                <Camera size={16} color="#fff" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
            <p className="avatar-tip">Bấm vào ảnh để tải lên từ thiết bị hoặc chọn mẫu bên dưới:</p>
            
            {/* Presets Grid */}
            <div className="avatar-presets-grid">
              {PRESET_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  className={`avatar-preset-btn ${selectedAvatar === url ? 'active' : ''}`}
                  onClick={() => handleAvatarSelect(url)}
                >
                  <img src={url} alt={`Preset ${index + 1}`} />
                  {selectedAvatar === url && (
                    <div className="preset-selected-badge">
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            {/* Username Input */}
            <div className="settings-form-group">
              <label className="settings-form-label">
                <User size={16} /> Tên hiển thị
              </label>
              <input
                type="text"
                className="settings-form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                required
              />
            </div>

            {/* Quick Lock Application */}
            <div className="quick-lock-section">
              <button 
                type="button" 
                className="quick-lock-btn" 
                onClick={() => {
                  onLockApp();
                  onClose();
                }}
              >
                <ShieldAlert size={16} /> Khóa ứng dụng ngay lập tức
              </button>
            </div>

            {/* Toggle Password Section */}
            <div className="password-accordion-header" onClick={() => setShowPasswordChange(!showPasswordChange)}>
              <div className="accordion-title">
                <KeyRound size={16} />
                <span>Thiết lập / Thay đổi mật khẩu</span>
              </div>
              <span className={`accordion-arrow ${showPasswordChange ? 'open' : ''}`}>▼</span>
            </div>

            {showPasswordChange && (
              <div className="password-fields animate-slideDown">
                <div className="settings-form-group">
                  <label className="settings-form-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mật khẩu cũ của bạn..."
                    required={showPasswordChange}
                  />
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label className="settings-form-label">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="settings-form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mã mới..."
                      required={showPasswordChange}
                    />
                  </div>
                  <div className="settings-form-group">
                    <label className="settings-form-label">Nhập lại mã mới</label>
                    <input
                      type="password"
                      className="settings-form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại..."
                      required={showPasswordChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="settings-actions">
              <button type="button" className="settings-cancel-btn" onClick={onClose} disabled={loading}>
                Hủy bỏ
              </button>
              <button type="submit" className="settings-submit-btn" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
