import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserScores } from '../services/dataService';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy, Mic, Target, TrendingUp, BookOpen, Headphones, MessageSquare, Flame, ArrowRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function Dashboard() {
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
    return <div className="main-content">Loading dashboard...</div>;
  }

  const totalTests = scores.length;
  const avgScore = totalTests > 0 ? Math.round(scores.reduce((s, sc) => s + sc.overall, 0) / totalTests) : 0;
  const bestScore = totalTests > 0 ? Math.max(...scores.map(s => s.overall)) : 0;
  const lastScore = scores[0];

  const chartData = {
    labels: scores.slice(0, 10).reverse().map((_, i) => `Test ${i + 1}`),
    datasets: [{
      label: 'Score',
      data: scores.slice(0, 10).reverse().map(s => s.overall),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6',
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
    },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a2e', titleColor: '#f8fafc', bodyColor: '#94a3b8' } },
  };

  const stats = [
    { icon: <Target size={22} />, label: 'Total Tests', value: totalTests, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)' },
    { icon: <BarChart3 size={22} />, label: 'Average Score', value: avgScore, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.12)' },
    { icon: <Trophy size={22} />, label: 'Best Score', value: bestScore, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.12)' },
    { icon: <Flame size={22} />, label: 'Streak', value: `${user.streak || 0}d`, color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.12)' },
  ];

  return (
    <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>{totalTests > 0 ? `You've completed ${totalTests} assessment${totalTests > 1 ? 's' : ''}. Keep going!` : 'Ready to start your English speaking journey? Take your first assessment!'}</p>
        <Link to="/test-portal" className="btn btn-primary" style={{ marginTop: 16 }}>
          <Mic size={18} /> {totalTests > 0 ? 'Continue Practice' : 'Start Assessment'} <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="cards-grid cards-grid-4" style={{ marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <TrendingUp size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="cards-grid cards-grid-2">
        {/* Progress Chart */}
        <div className="chart-container">
          <h3><TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Progress Over Time</h3>
          {totalTests > 0 ? (
            <div style={{ height: 250 }}><Line data={chartData} options={chartOptions} /></div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Complete assessments to see your progress chart</div>
          )}
        </div>

        {/* Recent Scores */}
        <div className="chart-container">
          <h3><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Recent Scores</h3>
          {scores.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto' }}>
              {scores.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Assessment #{scores.length - i}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-blue"><BookOpen size={12} /> {s.reading}</span>
                    <span className="badge badge-purple"><Headphones size={12} /> {s.listening}</span>
                    <span className="badge badge-emerald"><MessageSquare size={12} /> {s.speaking}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: s.overall >= 70 ? 'var(--accent-emerald)' : s.overall >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{s.overall}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No scores yet. Take your first test!</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Quick Start</h3>
        <div className="cards-grid cards-grid-3">
          {[
            { title: 'Reading Test', desc: 'Read a paragraph and get scored', icon: <BookOpen size={24} />, color: 'var(--accent-blue)', link: '/assessment/reading' },
            { title: 'Listening Test', desc: 'Listen and reproduce audio', icon: <Headphones size={24} />, color: 'var(--accent-purple)', link: '/assessment/listening' },
            { title: 'JAM Session', desc: 'Speak on a random topic', icon: <MessageSquare size={24} />, color: 'var(--accent-emerald)', link: '/assessment/jam' },
          ].map((a, i) => (
            <Link key={i} to={a.link} style={{ textDecoration: 'none' }}>
              <div className="assessment-card" style={{ minHeight: 'auto' }}>
                <div className="card-icon" style={{ background: `${a.color}15`, color: a.color }}>{a.icon}</div>
                <h4 style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                <p style={{ marginBottom: 0 }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
