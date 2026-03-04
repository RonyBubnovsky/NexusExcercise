// NavBar – top navigation with brand logo and mode switcher.

import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="nav">
      <span className="nav-brand">🎟️ NexusCouponExcercise</span>
      <Link to="/">
        <button className={`nav-link ${!isAdmin ? 'active' : ''}`}>Store</button>
      </Link>
      <Link to="/admin">
        <button className={`nav-link ${isAdmin ? 'active' : ''}`}>Admin</button>
      </Link>
    </nav>
  );
}
