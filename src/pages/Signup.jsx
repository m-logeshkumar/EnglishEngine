import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Building, UserPlus, Mic } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(name, email, password, college);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gradient-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={20} color="white" /></div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem' }}>VoiceIQ AI</span>
          </div>
        </div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Start your English speaking journey</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Full Name</label>
            <input className="input-field" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label><Lock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Password</label>
            <input className="input-field" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label><Building size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />College / Organization (optional)</label>
            <input className="input-field" type="text" placeholder="e.g. MIT, Google" value={college} onChange={e => setCollege(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
