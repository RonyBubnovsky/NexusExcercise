// App – root component with navigation between Customer and Admin modes.
// Uses React Router for page routing.

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

import StorePage from './pages/StorePage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function NavBar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="nav">
      <Link to="/">
        <button className={!isAdmin ? 'active' : ''}>Store</button>
      </Link>
      <Link to="/admin">
        <button className={isAdmin ? 'active' : ''}>Admin</button>
      </Link>
    </nav>
  );
}

function AdminSection() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const handleLogin = (jwt) => {
    localStorage.setItem('adminToken', jwt);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  if (!token) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  return <AdminDashboardPage token={token} onLogout={handleLogout} />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <NavBar />
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/admin" element={<AdminSection />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
