import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserScores } from '../services/dataService';
import { User, Mail, Building, Calendar, BarChart3, Trophy } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScores() {
      if (!user?.id) return;
      const data = await getUserScores(user.id);
      setScores(data);
      setLoading(false);
    }

    loadScores().catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) {
    return <div className="main-content">Loading profile...</div>;
  }

  const totalTests = scores.length;
  const avgScore = totalTests > 0 ? Math.round(scores.reduce((s, sc) => s + sc.overall, 0) / totalTests) : 0;

  return (
    <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease', maxWidth: 700, margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, margin: '0 auto 16px' }}>
          {user.avatar}
        </div>
        <h2>{user.name}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        {user.college && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><Building size={14} style={{ verticalAlign: 'middle' }} /> {user.college}</p>}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24 }}>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{totalTests}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tests</div></div>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{avgScore}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Score</div></div>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{user.role}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</div></div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16 }}>Score History</h3>
      {scores.length > 0 ? scores.map((s, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Assessment #{scores.length - i}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-blue">R: {s.reading}</span>
            <span className="badge badge-emerald">L: {s.listening}</span>
            <span className="badge badge-purple">S: {s.speaking}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.3rem', color: s.overall >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{s.overall}</div>
        </div>
      )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No scores yet. Take your first test!</p>}
    </div>
  );
}
