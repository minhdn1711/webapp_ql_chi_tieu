import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, PiggyBank, Wallet } from 'lucide-react';
import Dashboard from './screens/Dashboard';
import AddTransaction from './screens/AddTransaction';
import Transactions from './screens/Transactions';
import SavingGoals from './screens/SavingGoals';
import Debts from './screens/Debts';
import CategoryManagement from './screens/CategoryManagement';
import LockScreen from './screens/LockScreen';
import SettingsModal from './components/SettingsModal';
import './App.css';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Nhà mình</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <List size={24} />
        <span>Lịch sử</span>
      </NavLink>
      <div className="nav-item-fab">
        <NavLink to="/add" className="fab-button">
          <PlusCircle size={32} color="#fff" />
        </NavLink>
      </div>
      <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PiggyBank size={24} />
        <span>Mục tiêu</span>
      </NavLink>
      <div className="nav-item">
        {/* Placeholder for symmetry if needed, or adjust flex */}
      </div>
    </nav>
  );
};

// A better bottom nav
const BottomNavClean = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <Home size={22} />
        <span>Tổng quan</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <List size={22} />
        <span>Giao dịch</span>
      </NavLink>
      <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PiggyBank size={22} />
        <span>Tiết kiệm</span>
      </NavLink>
      <NavLink to="/debts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Wallet size={22} />
        <span>Nợ cần thu</span>
      </NavLink>
    </nav>
  );
};

const Header = ({ profile, onAvatarClick }) => {
  const location = useLocation();
  let title = "Nhà mình tháng này";
  
  if (location.pathname === '/add') title = "Thêm giao dịch";
  if (location.pathname === '/transactions') title = "Lịch sử chi tiêu";
  if (location.pathname === '/goals') title = "Mục tiêu tiết kiệm";
  if (location.pathname === '/debts') title = "Nợ cần thu";

  return (
    <header className="app-header">
      <div className="app-header-content">
        <h1>{title}</h1>
        <div className="header-avatar-container" onClick={onAvatarClick} title="Cài đặt & Hồ sơ">
          <img 
            src={profile?.avatar} 
            alt="User Avatar" 
            className="header-avatar"
            onError={(e) => {
              e.target.src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix';
            }}
          />
        </div>
      </div>
    </header>
  );
};

import { ToastProvider } from './context/ToastContext';
import { CategoryProvider } from './context/CategoryContext';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('isUnlocked') === 'true');
  const [profile, setProfile] = useState({
    username: 'Gia Đình Nhỏ',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      fetch('/api/settings/profile')
        .then(res => res.json())
        .then(data => {
          if (data && data.username) {
            setProfile(data);
          }
        })
        .catch(err => console.error('Lỗi tải profile trong App:', err));
    }
  }, [isUnlocked]);

  const handleLockApp = () => {
    sessionStorage.removeItem('isUnlocked');
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <CategoryProvider>
      <ToastProvider>
        <Router>
          <Header profile={profile} onAvatarClick={() => setIsSettingsOpen(true)} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/edit/:id" element={<AddTransaction isEdit={true} />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/goals" element={<SavingGoals />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/categories" element={<CategoryManagement />} />
          </Routes>
          <BottomNavClean />
          
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            currentProfile={profile} 
            onProfileUpdate={(newProfile) => setProfile(newProfile)} 
            onLockApp={handleLockApp}
          />
        </Router>
      </ToastProvider>
    </CategoryProvider>
  );
}

export default App;
