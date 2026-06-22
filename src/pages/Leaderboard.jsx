import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard } from '../services/dataService';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All Time' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
];

export default function Leaderboard() {
  const [tab, setTab] = useState('all');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadLeaderboard() {
      const leaderboard = await getLeaderboard(tab);
      setData(leaderboard);
      setLoading(false);
    }

    setLoading(true);
    loadLeaderboard().catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [tab]);

  if (loading) {
    return <div className="main-content">Loading leaderboard...</div>;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [
    { bg: 'var(--gradient-blue)', avatarBg: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { bg: 'rgba(148,163,184,0.1)', avatarBg: 'linear-gradient(135deg, #94a3b8, #64748b)' },
    { bg: 'rgba(180,83,9,0.1)', avatarBg: 'linear-gradient(135deg, #b45309, #92400e)' },
  ];

  return (
    <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div className="section-header" style={{ textAlign: 'center' }}>
        <h1><Trophy size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-amber)' }} />Leaderboard</h1>
        <p>See how you rank against other speakers</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h3>No scores yet</h3>
          <p>Complete assessments to appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {data.length >= 3 && (
            <div className="podium">
              {[1, 0, 2].map(idx => {
                const entry = data[idx];
                if (!entry) return null;
                const cls = idx === 0 ? 'first' : idx === 1 ? 'second' : 'third';
                return (
                  <div key={idx} className={`podium-item ${cls}`}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{medals[idx]}</div>
                    <div className="podium-avatar" style={{ background: podiumColors[idx]?.avatarBg }}>{entry.userName?.charAt(0) || '?'}</div>
                    <div className="podium-name">{entry.userName}</div>
                    {entry.college && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{entry.college}</div>}
                    <div className="podium-score">{entry.overall}</div>
                    <span className={`badge badge-${entry.performanceLevel === 'Expert' ? 'purple' : entry.performanceLevel === 'Advanced' ? 'blue' : 'amber'}`} style={{ marginTop: 8 }}>
                      {entry.performanceLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>College</th>
                  <th>Reading</th>
                  <th>Listening</th>
                  <th>Speaking</th>
                  <th>Overall</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => (
                  <tr key={i} className={entry.userId === user?.id ? 'current-user' : ''}>
                    <td>{i < 3 ? <span className="rank-medal">{medals[i]}</span> : <span className="rank-number">{i + 1}</span>}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                          {entry.userName?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{entry.userName}{entry.userId === user?.id && <span style={{ color: 'var(--accent-blue)', fontSize: '0.75rem', marginLeft: 6 }}>(You)</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.college || '—'}</td>
                    <td><span className="badge badge-blue">{entry.reading}</span></td>
                    <td><span className="badge badge-emerald">{entry.listening}</span></td>
                    <td><span className="badge badge-purple">{entry.speaking}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: entry.overall >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{entry.overall}</td>
                    <td><span className={`badge badge-${entry.performanceLevel === 'Expert' ? 'purple' : entry.performanceLevel === 'Advanced' ? 'blue' : entry.performanceLevel === 'Intermediate' ? 'amber' : 'rose'}`}>{entry.performanceLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
