import { Link } from 'react-router-dom';
import { Mic, BookOpen, Headphones, MessageSquare, BarChart3, Trophy, Brain, Sparkles } from 'lucide-react';

const features = [
  { icon: <Mic size={24} />, title: 'Pronunciation Analysis', desc: 'AI-powered pronunciation scoring with word-level feedback and accent analysis.', color: 'var(--accent-blue)' },
  { icon: <BookOpen size={24} />, title: 'Reading Fluency Test', desc: 'Read paragraphs aloud and get scored on fluency, speed, and clarity.', color: 'var(--accent-emerald)' },
  { icon: <Headphones size={24} />, title: 'Listening Practice', desc: 'Listen to audio content and reproduce it to test comprehension skills.', color: 'var(--accent-purple)' },
  { icon: <MessageSquare size={24} />, title: 'JAM Speaking', desc: 'Just A Minute sessions on diverse topics to build spontaneous speaking ability.', color: 'var(--accent-amber)' },
  { icon: <BarChart3 size={24} />, title: 'Detailed Analytics', desc: 'Track your progress with comprehensive reports and performance analytics.', color: 'var(--accent-cyan)' },
  { icon: <Trophy size={24} />, title: 'Leaderboard', desc: 'Compete with peers and climb the global rankings based on your scores.', color: 'var(--accent-rose)' },
];

export default function Landing() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="badge badge-blue" style={{ marginBottom: 20, fontSize: '0.85rem', padding: '6px 16px' }}>
            <Sparkles size={14} /> AI-Powered English Practice
          </div>
          <h1>Master English Speaking with <span>VoiceIQ AI</span></h1>
          <p>Professional IELTS-level speaking practice with AI-powered evaluation. Get real-time feedback on pronunciation, fluency, grammar, and confidence.</p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-lg">
              <Mic size={20} /> Start Practicing Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Log In</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Assessment Types</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">8+</div>
              <div className="hero-stat-label">Skill Metrics</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">AI</div>
              <div className="hero-stat-label">Powered Analysis</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">∞</div>
              <div className="hero-stat-label">Practice Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose <span style={{ color: 'var(--accent-blue)' }}>VoiceIQ AI</span>?</h2>
        <p>Everything you need to master English speaking, all in one platform.</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-card-icon" style={{ background: `${f.color}15`, color: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="features-section" style={{ paddingTop: 0 }}>
        <h2>How It Works</h2>
        <p>Three simple steps to improve your English speaking skills.</p>
        <div className="features-grid" style={{ maxWidth: 900, margin: '0 auto' }}>
          {[
            { step: '01', icon: <Brain size={28} />, title: 'Take Assessments', desc: 'Complete reading, listening, and speaking assessments at your own pace.' },
            { step: '02', icon: <Sparkles size={28} />, title: 'Get AI Feedback', desc: 'Receive detailed AI analysis of your pronunciation, fluency, and more.' },
            { step: '03', icon: <BarChart3 size={28} />, title: 'Track Progress', desc: 'Monitor your improvement over time with analytics and leaderboards.' },
          ].map((s, i) => (
            <div key={i} className="feature-card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 20, fontSize: '2.5rem', fontWeight: 800, color: 'var(--bg-elevated)', fontFamily: 'var(--font-heading)' }}>{s.step}</div>
              <div className="feature-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', margin: '0 auto 20px' }}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>Ready to Improve Your English?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>Join VoiceIQ AI and start your journey to fluent English speaking today.</p>
        <Link to="/signup" className="btn btn-primary btn-lg"><Mic size={20} /> Get Started Now</Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2026 VoiceIQ AI. All rights reserved. | Built with AI-Powered Technology
      </footer>
    </div>
  );
}
