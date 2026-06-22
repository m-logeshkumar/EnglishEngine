import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mic, LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
        <div className="logo-icon"><Mic size={20} color="white" /></div>
        <span>VoiceIQ <span style={{ color: 'var(--accent-blue)' }}>AI</span></span>
      </Link>
      {user && (
        <div className="navbar-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/test-portal">Test Portal</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          {isAdmin && <NavLink to="/admin" style={{ color: 'var(--accent-amber)' }}><Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Admin</NavLink>}
        </div>
      )}
      <div className="navbar-user">
        {user ? (
          <>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.name}</span>
            <div className="navbar-avatar" onClick={() => navigate('/profile')} title="Profile">{user.avatar}</div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout"><LogOut size={18} /></button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
