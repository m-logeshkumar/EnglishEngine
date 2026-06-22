import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllScores, getParagraphs, getTopics, getListeningItems, addParagraph, addTopic, addListeningItem, deleteParagraph, deleteTopic, deleteListeningItem, deleteAssessmentResult, deleteUserById } from '../../services/dataService';
import { Shield, Users, BarChart3, BookOpen, Headphones, MessageSquare, Plus, Trash2, X } from 'lucide-react';

export default function AdminDashboard() {
  const { getAllUsers } = useAuth();
  const [tab, setTab] = useState('overview');
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [listening, setListening] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refreshData() {
    const [u, s, p, t, l] = await Promise.all([
      getAllUsers(),
      getAllScores(),
      getParagraphs(),
      getTopics(),
      getListeningItems(),
    ]);
    setUsers(u);
    setScores(s);
    setParagraphs(p);
    setTopics(t);
    setListening(l);
  }

  useEffect(() => {
    refreshData()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users size={22} />, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Assessments Taken', value: scores.length, icon: <BarChart3 size={22} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Paragraphs', value: paragraphs.length, icon: <BookOpen size={22} />, color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.12)' },
    { label: 'JAM Topics', value: topics.length, icon: <MessageSquare size={22} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.12)' },
  ];

  const handleAdd = async () => {
    if (showModal === 'paragraph') {
      await addParagraph({ title: formData.title, text: formData.text, difficulty: formData.difficulty || 'Intermediate' });
    } else if (showModal === 'topic') {
      await addTopic({ title: formData.title, description: formData.description });
    } else if (showModal === 'listening') {
      await addListeningItem({ title: formData.title, text: formData.text, difficulty: formData.difficulty || 'Intermediate' });
    }
    setShowModal(null);
    setFormData({});
    await refreshData();
  };

  const handleDelete = async (type, id) => {
    if (type === 'paragraph') await deleteParagraph(id);
    else if (type === 'topic') await deleteTopic(id);
    else if (type === 'listening') await deleteListeningItem(id);
    await refreshData();
  };

  const handleDeleteUser = async (user) => {
    const ok = window.confirm(`Delete user ${user.name}? This will also delete all their assessment results from DB.`);
    if (!ok) return;
    await deleteUserById(user.id);
    await refreshData();
  };

  const handleDeleteScore = async (score) => {
    const ok = window.confirm(`Delete assessment result for ${score.userName}?`);
    if (!ok) return;
    await deleteAssessmentResult(score.id);
    await refreshData();
  };

  if (loading) {
    return <div className="main-content">Loading admin dashboard...</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'paragraphs', label: 'Paragraphs' },
    { id: 'topics', label: 'Topics' },
    { id: 'listening', label: 'Listening' },
    { id: 'scores', label: 'All Scores' },
  ];

  return (
    <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div className="admin-header">
        <div>
          <h1><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-amber)' }} />Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage assessments, users, and content</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 32, flexWrap: 'wrap' }}>
        {tabs.map(t => <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="cards-grid cards-grid-4">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg, color: s.color, marginBottom: 12 }}>{s.icon}</div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>College</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.college || '—'}</td>
                  <td><span className={`badge badge-${u.role === 'admin' ? 'amber' : 'blue'}`}>{u.role}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.role !== 'admin' ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteUser(u)} style={{ color: 'var(--accent-rose)' }}>
                        <Trash2 size={14} />
                      </button>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Protected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paragraphs */}
      {tab === 'paragraphs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal('paragraph')}><Plus size={16} /> Add Paragraph</button>
          </div>
          {paragraphs.map((p, i) => (
            <div key={p.id} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <h4>{p.title}</h4>
                    <span className={`badge badge-${p.difficulty === 'Advanced' ? 'rose' : p.difficulty === 'Intermediate' ? 'amber' : 'emerald'}`}>{p.difficulty}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{p.text.substring(0, 200)}...</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('paragraph', p.id)} style={{ color: 'var(--accent-rose)' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Topics */}
      {tab === 'topics' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal('topic')}><Plus size={16} /> Add Topic</button>
          </div>
          <div className="cards-grid cards-grid-3">
            {topics.map(t => (
              <div key={t.id} className="glass-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4>{t.title}</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('topic', t.id)} style={{ color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>{t.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Listening */}
      {tab === 'listening' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal('listening')}><Plus size={16} /> Add Listening Item</button>
          </div>
          {listening.map(l => (
            <div key={l.id} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <h4>{l.title}</h4>
                    <span className="badge badge-blue">{l.difficulty}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{l.text.substring(0, 200)}...</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('listening', l.id)} style={{ color: 'var(--accent-rose)' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* All Scores */}
      {tab === 'scores' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="admin-table">
            <thead><tr><th>Student</th><th>Reading</th><th>Listening</th><th>Speaking</th><th>Overall</th><th>Level</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.userName}</td>
                  <td><span className="badge badge-blue">{s.reading}</span></td>
                  <td><span className="badge badge-emerald">{s.listening}</span></td>
                  <td><span className="badge badge-purple">{s.speaking}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.overall}</td>
                  <td><span className={`badge badge-${s.performanceLevel === 'Expert' ? 'purple' : 'amber'}`}>{s.performanceLevel}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteScore(s)} style={{ color: 'var(--accent-rose)' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {scores.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No scores recorded yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2>Add {showModal === 'paragraph' ? 'Paragraph' : showModal === 'topic' ? 'Topic' : 'Listening Item'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(null)}><X size={20} /></button>
            </div>
            <div className="auth-form">
              <div className="input-group">
                <label>Title</label>
                <input className="input-field" placeholder="Enter title" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              {showModal !== 'topic' && (
                <div className="input-group">
                  <label>{showModal === 'paragraph' ? 'Paragraph Text' : 'Listening Text'}</label>
                  <textarea className="input-field" rows={5} placeholder="Enter text content..." value={formData.text || ''} onChange={e => setFormData({ ...formData, text: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
              )}
              {showModal === 'topic' && (
                <div className="input-group">
                  <label>Description</label>
                  <input className="input-field" placeholder="Topic description" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              )}
              {showModal !== 'topic' && (
                <div className="input-group">
                  <label>Difficulty</label>
                  <select className="input-field" value={formData.difficulty || 'Intermediate'} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              )}
              <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}><Plus size={16} /> Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
