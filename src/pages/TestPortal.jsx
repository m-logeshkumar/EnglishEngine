import { Link } from 'react-router-dom';
import { BookOpen, Headphones, MessageSquare, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function TestPortal() {
  const assessments = [
    {
      id: 'reading',
      title: 'Reading Paragraph',
      subtitle: 'Fluency Test',
      desc: 'Read a paragraph aloud and get AI-powered feedback on your pronunciation, fluency, speech speed, confidence, and word stress.',
      icon: <BookOpen size={28} />,
      color: 'blue',
      colorVar: 'var(--accent-blue)',
      metrics: ['Pronunciation', 'Fluency', 'Speech Speed', 'Confidence', 'Word Stress'],
    },
    {
      id: 'listening',
      title: 'Audio Listening',
      subtitle: 'Listening Practice',
      desc: 'Listen to an audio passage carefully, then reproduce what you heard. AI evaluates your listening skills, memory retention, and pronunciation.',
      icon: <Headphones size={28} />,
      color: 'emerald',
      colorVar: 'var(--accent-emerald)',
      metrics: ['Listening Skills', 'Memory Retention', 'Pronunciation', 'Speech Clarity'],
    },
    {
      id: 'jam',
      title: 'Just A Minute (JAM)',
      subtitle: 'Speaking Session',
      desc: 'Speak freely on a given topic. AI analyzes your fluency, vocabulary, grammar, topic relevance, and idea clarity.',
      icon: <MessageSquare size={28} />,
      color: 'purple',
      colorVar: 'var(--accent-purple)',
      metrics: ['Fluency', 'Vocabulary', 'Grammar', 'Topic Relevance', 'Confidence'],
    },
  ];

  return (
    <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div className="section-header" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
        <h1>Test Portal</h1>
        <p>Complete all 3 assessments to receive your comprehensive AI-powered evaluation report.</p>
      </div>

      <div className="cards-grid" style={{ maxWidth: 900, margin: '0 auto', gap: 28 }}>
        {assessments.map((a, i) => (
          <Link key={a.id} to={`/assessment/${a.id}`} style={{ textDecoration: 'none' }}>
            <div className={`assessment-card ${a.color}`} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', animationDelay: `${i * 0.15}s` }}>
              <div className="card-icon" style={{ background: `${a.colorVar}15`, color: a.colorVar, flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`badge badge-${a.color}`}>{a.subtitle}</span>
                </div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{a.title}</h3>
                <p style={{ marginBottom: 16 }}>{a.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {a.metrics.map((m, j) => (
                    <span key={j} style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>{m}</span>
                  ))}
                </div>
                <div className="btn btn-secondary btn-sm">
                  Start Assessment <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        No time limit — practice at your own pace
      </div>
    </div>
  );
}
