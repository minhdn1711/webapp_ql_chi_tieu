import React, { useState, useEffect } from 'react';
import { Delete, Lock, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
import './LockScreen.css';

const LockScreen = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: 'Gia Đình Nhỏ',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'
  });

  // Fetch profile settings on load to display personalized Lock Screen
  useEffect(() => {
    fetch('/api/settings/profile')
      .then(res => res.json())
      .then(data => {
        if (data && data.username) {
          setProfile(data);
        }
      })
      .catch(err => console.error('Lỗi tải profile trên màn hình khóa:', err));
  }, []);

  const handleKeyPress = (char) => {
    if (error) setError(false);
    setPassword(prev => {
      if (prev.length >= 6) return prev;
      const nextVal = prev + char;
      if (nextVal.length === 6) {
        setTimeout(() => handleSubmit(null, nextVal), 150);
      }
      return nextVal;
    });
  };

  const handleBackspace = () => {
    if (error) setError(false);
    setPassword(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (error) setError(false);
    setPassword('');
  };

  const handleSubmit = async (e, customPassword) => {
    if (e && e.preventDefault) e.preventDefault();
    const pinToSubmit = customPassword !== undefined ? customPassword : password;
    if (!pinToSubmit || loading) return;

    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pinToSubmit })
      });
      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('isUnlocked', 'true');
        onUnlock();
      } else {
        setError(true);
        setPassword('');
        // Trigger vibration on devices that support it
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [password, loading]);

  return (
    <div className="lock-screen-overlay">
      <div className="lock-screen-container">
        {/* User profile section */}
        <div className="lock-profile">
          <div className="lock-avatar-wrapper">
            <img 
              src={profile.avatar} 
              alt="User Avatar" 
              className="lock-avatar" 
              onError={(e) => {
                e.target.src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix';
              }}
            />
            <div className="lock-badge">
              <Lock size={12} color="#fff" />
            </div>
          </div>
          <h2 className="lock-username">{profile.username}</h2>
          <p className="lock-subtitle">Ứng dụng đã được khóa bảo mật</p>
        </div>

        {/* Input indicators */}
        <div className={`lock-input-area ${error ? 'shake-error' : ''}`}>
          {showPassword ? (
            <input 
              type="text" 
              className="lock-password-text" 
              value={password}
              placeholder="Nhập mã mở khóa" 
              readOnly 
            />
          ) : (
            <div className="lock-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`lock-dot ${i < password.length ? 'filled' : ''} ${error ? 'error' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="lock-error-message">Mật khẩu không đúng. Vui lòng thử lại!</p>}

        {/* Numeric Keypad */}
        <div className="lock-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              type="button" 
              className="keypad-btn" 
              onClick={() => handleKeyPress(num.toString())}
            >
              {num}
            </button>
          ))}
          
          <button 
            type="button" 
            className="keypad-btn utility" 
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          
          <button 
            type="button" 
            className="keypad-btn" 
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>
          
          <button 
            type="button" 
            className="keypad-btn utility" 
            onClick={handleBackspace}
            title="Xóa chữ số vừa nhập"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Submit button */}
        <button 
          type="button" 
          className={`lock-submit-btn ${password.length > 0 ? 'active' : ''}`}
          onClick={() => handleSubmit()}
          disabled={loading || password.length === 0}
        >
          {loading ? 'Đang kiểm tra...' : 'Mở khóa ứng dụng'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
