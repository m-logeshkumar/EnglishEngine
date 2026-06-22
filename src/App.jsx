import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TestPortal from './pages/TestPortal';
import Assessment from './pages/Assessment';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();
  const hideNavbar = ['/', '/login', '/signup'].includes(location.pathname);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <span className="loading-text">Connecting to VoiceIQ AI... (Waking up server, please wait)</span>
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div style={!hideNavbar ? { paddingTop: 64 } : {}}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/test-portal" element={<ProtectedRoute><TestPortal /></ProtectedRoute>} />
          <Route path="/assessment/:type" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
