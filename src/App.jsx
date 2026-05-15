import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, PiggyBank } from 'lucide-react';
import Dashboard from './screens/Dashboard';
import AddTransaction from './screens/AddTransaction';
import Transactions from './screens/Transactions';
import SavingGoals from './screens/SavingGoals';
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
        <Home size={24} />
        <span>Tổng quan</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <List size={24} />
        <span>Giao dịch</span>
      </NavLink>
      <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PiggyBank size={24} />
        <span>Tiết kiệm</span>
      </NavLink>
    </nav>
  );
};

const Header = () => {
  const location = useLocation();
  let title = "Nhà mình tháng này";
  
  if (location.pathname === '/add') title = "Thêm giao dịch";
  if (location.pathname === '/transactions') title = "Lịch sử chi tiêu";
  if (location.pathname === '/goals') title = "Mục tiêu tiết kiệm";

  return (
    <header className="app-header">
      <h1>{title}</h1>
    </header>
  );
};

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/goals" element={<SavingGoals />} />
      </Routes>
      <BottomNavClean />
    </Router>
  );
}

export default App;
