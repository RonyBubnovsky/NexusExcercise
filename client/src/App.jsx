// App – root component with routing between Store and Admin modes.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import useAuth from './hooks/useAuth';

import StorePage from './pages/store/StorePage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function AdminSection() {
  const { token, login, logout } = useAuth();

  if (!token) {
    return <AdminLoginPage onLogin={login} />;
  }

  return <AdminDashboardPage token={token} onLogout={logout} />;
}

export default function App() {
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
