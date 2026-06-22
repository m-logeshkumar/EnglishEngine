import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReadingParagraph from '../components/assessment/ReadingParagraph';
import ListeningPractice from '../components/assessment/ListeningPractice';
import JamSession from '../components/assessment/JamSession';
import { generateFinalReport } from '../services/aiService';
import { saveScore } from '../services/dataService';
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, Headphones, MessageSquare, Trophy, AlertCircle, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'reading', label: 'Reading', icon: <BookOpen size={18} /> },
  { id: 'listening', label: 'Listening', icon: <Headphones size={18} /> },
  { id: 'jam', label: 'JAM', icon: <MessageSquare size={18} /> },
];

export default function Assessment() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(type === 'listening' ? 1 : type === 'jam' ? 2 : 0);
  const [results, setResults] = useState({ reading: null, listening: null, jam: null });
  const [savedSteps, setSavedSteps] = useState({ reading: false, listening: false, jam: false });
  const [showFinal, setShowFinal] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Stop any ongoing speech recognition
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        // Speech recognition cleanup is handled in individual components
      }
    };
  }, []);

  const buildSingleStepReport = useCallback((stepId, result) => {
    const safeResult = result || {};
    const reading = stepId === 'reading' ? (safeResult?.overallScore || 0) : 0;
    const listening = stepId === 'listening' ? (safeResult?.overallScore || 0) : 0;
    const speaking = stepId === 'jam' ? (safeResult?.overallScore || 0) : 0;
    const overall = safeResult?.overallScore || 0;

    return {
      overall,
      performanceLevel: safeResult?.performanceLevel || 'Beginner',
      scores: { reading, listening, speaking },
      pronunciation: safeResult?.pronunciation || 0,
      fluency: safeResult?.fluency || 0,
      listening: safeResult?.listeningScore || safeResult?.accuracy || listening,
      confidence: safeResult?.confidence || 0,
      vocabulary: safeResult?.vocabulary || 0,
      grammar: safeResult?.grammarClarity || safeResult?.grammar || 0,
      strengths: [stepId.charAt(0).toUpperCase() + stepId.slice(1)],
      weaknesses: [],
      tips: Array.isArray(safeResult?.tips) ? safeResult.tips : [],
      date: new Date().toISOString(),
    };
  }, []);

  const handleComplete = useCallback(async (stepId, result) => {
    if (!result) return;
    
    setResults(prev => ({ ...prev, [stepId]: result }));
    setError(null);

    // Save each completed test immediately
    if (!savedSteps[stepId] && user?.id) {
      try {
        const stepReport = buildSingleStepReport(stepId, result);
        const saved = await saveScore(user.id, user.name, user.college || '', stepReport);
        if (saved && typeof saved?.streak === 'number') {
          updateUser({ streak: saved.streak });
        }
        setSavedSteps(prev => ({ ...prev, [stepId]: true }));
      } catch (err) {
        console.error('Failed to save step score:', err);
        setError('Failed to save your score. Please try again.');
      }
    }
  }, [savedSteps, user, updateUser, buildSingleStepReport]);

  const goToNext = useCallback(async () => {
    if (isSubmitting) return;
    
    try {
      setError(null);
      
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleFinish();
      }
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Failed to proceed. Please try again.');
    }
  }, [currentStep, isSubmitting]);

  const handleFinish = useCallback(async () => {
    if (isSubmitting || isGeneratingReport) return;
    
    setIsSubmitting(true);
    setIsGeneratingReport(true);
    setError(null);
    
    try {
      // Ensure all results are safe
      const safeReading = results.reading || {};
      const safeListening = results.listening || {};
      const safeJam = results.jam || {};
      
      const report = generateFinalReport(safeReading, safeListening, safeJam);
      setFinalReport(report);
      
      if (user?.id) {
        try {
          const saved = await saveScore(user.id, user.name, user.college || '', report);
          if (saved && typeof saved?.streak === 'number') {
            updateUser({ streak: saved.streak });
          }
        } catch (err) {
          console.error('Failed to save final report:', err);
          // Don't block showing report if save fails
        }
      }
      
      setShowFinal(true);
    } catch (err) {
      console.error('Failed to generate final report:', err);
      setError('Failed to generate final report. Please try again.');
      setIsSubmitting(false);
      setIsGeneratingReport(false);
    } finally {
      // Only reset submitting if not showing final
      if (!showFinal) {
        setIsSubmitting(false);
        setIsGeneratingReport(false);
      }
    }
  }, [results, user, updateUser, isSubmitting, isGeneratingReport, showFinal]);

  const canProceed = useCallback(() => {
    const stepId = STEPS[currentStep]?.id;
    return stepId && results[stepId] !== null;
  }, [currentStep, results]);

  const handleRetry = useCallback(() => {
    setError(null);
    // Retry the current step
    const stepId = STEPS[currentStep]?.id;
    if (stepId) {
      // Reset the result for the current step to allow re-attempt
      setResults(prev => ({ ...prev, [stepId]: null }));
      setSavedSteps(prev => ({ ...prev, [stepId]: false }));
    }
  }, [currentStep]);

  // Error boundary fallback render
  if (error && !showFinal) {
    return (
      <div className="main-content">
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <AlertCircle size={48} style={{ color: 'var(--accent-rose)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 12 }}>Something went wrong</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleRetry}>
              <ArrowLeft size={16} /> Retry
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showFinal && finalReport) {
    return (
      <div className="main-content" style={{ animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <Trophy size={48} style={{ color: 'var(--accent-amber)', marginBottom: 16 }} />
            <h1>Assessment Complete!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Here's your comprehensive AI-powered evaluation report</p>
          </div>
          
          {error && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 24, borderColor: 'var(--accent-rose)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-rose)' }}>
                <AlertCircle size={20} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
              </div>
            </div>
          )}
          
          <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
            <div className="overall-score" style={{ fontSize: '5rem' }}>{finalReport.overall || 0}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Overall Score</p>
            <span className={`performance-badge ${String(finalReport.performanceLevel || 'Beginner').toLowerCase()}`} style={{ fontSize: '1.1rem', padding: '10px 28px', marginTop: 16 }}>
              {finalReport.performanceLevel === 'Expert' ? '💎' : finalReport.performanceLevel === 'Advanced' ? '🥇' : finalReport.performanceLevel === 'Intermediate' ? '🥈' : '🥉'} {finalReport.performanceLevel || 'Beginner'}
            </span>
          </div>

          {/* Section Scores */}
          <div className="cards-grid cards-grid-3" style={{ marginBottom: 32 }}>
            {[
              { label: 'Reading', score: finalReport.scores?.reading || 0, icon: <BookOpen size={24} />, color: 'var(--accent-blue)' },
              { label: 'Listening', score: finalReport.scores?.listening || 0, icon: <Headphones size={24} />, color: 'var(--accent-emerald)' },
              { label: 'Speaking', score: finalReport.scores?.speaking || 0, icon: <MessageSquare size={24} />, color: 'var(--accent-purple)' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
                <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.score}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Skill Breakdown */}
          <div className="glass-card" style={{ padding: 32, marginBottom: 32, textAlign: 'left' }}>
            <h3 style={{ marginBottom: 20 }}>Skill Breakdown</h3>
            {[
              { label: 'Pronunciation', score: finalReport.pronunciation || 0, color: '#3b82f6' },
              { label: 'Fluency', score: finalReport.fluency || 0, color: '#10b981' },
              { label: 'Listening', score: finalReport.listening || 0, color: '#8b5cf6' },
              { label: 'Confidence', score: finalReport.confidence || 0, color: '#f59e0b' },
              { label: 'Vocabulary', score: finalReport.vocabulary || 0, color: '#06b6d4' },
              { label: 'Grammar', score: finalReport.grammar || 0, color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} className="skill-bar">
                <span className="skill-bar-label">{s.label}</span>
                <div className="skill-bar-track"><div className="skill-bar-fill" style={{ width: `${Math.min(s.score, 100)}%`, background: s.color }} /></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: s.color, minWidth: 35 }}>{Math.min(s.score, 100)}</span>
              </div>
            ))}
          </div>

          {/* Strengths / Weaknesses */}
          <div className="cards-grid cards-grid-2" style={{ marginBottom: 32, textAlign: 'left' }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h4 style={{ color: 'var(--accent-emerald)', marginBottom: 12 }}>💪 Strengths</h4>
              {Array.isArray(finalReport.strengths) && finalReport.strengths.length > 0 ? (
                finalReport.strengths.map((s, i) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>✅ {s}</p>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Keep practicing to build strengths!</p>
              )}
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <h4 style={{ color: 'var(--accent-rose)', marginBottom: 12 }}>📈 Areas to Improve</h4>
              {Array.isArray(finalReport.weaknesses) && finalReport.weaknesses.length > 0 ? (
                finalReport.weaknesses.map((w, i) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>🔸 {w}</p>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Excellent across all areas!</p>
              )}
            </div>
          </div>

          {/* Tips */}
          {Array.isArray(finalReport?.tips) && finalReport.tips.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 32, textAlign: 'left' }}>
              <h4 style={{ color: 'var(--accent-amber)', marginBottom: 12 }}>💡 Personalized Recommendations</h4>
              {finalReport.tips.map((t, i) => (
                <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
                  • {t}
                </p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/leaderboard')} disabled={isSubmitting}>
              <Trophy size={16} /> View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 24, borderColor: 'var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-rose)' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleRetry}
              style={{ marginLeft: 'auto' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => setCurrentStep(i)}
              disabled={isSubmitting || isGeneratingReport}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                borderRadius: 'var(--radius-full)', border: 'none', cursor: (isSubmitting || isGeneratingReport) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem',
                background: i === currentStep ? 'var(--accent-blue)' : results[step.id] ? 'rgba(16,185,129,0.15)' : 'var(--glass-bg)',
                color: i === currentStep ? 'white' : results[step.id] ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
                opacity: (isSubmitting || isGeneratingReport) ? 0.6 : 1,
              }}>
              {results[step.id] ? <CheckCircle2 size={16} /> : step.icon}
              {step.label}
            </button>
            {i < 2 && <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />}
          </div>
        ))}
      </div>

      {/* Current Assessment */}
      {currentStep === 0 && <ReadingParagraph onComplete={(r) => handleComplete('reading', r)} />}
      {currentStep === 1 && <ListeningPractice onComplete={(r) => handleComplete('listening', r)} />}
      {currentStep === 2 && <JamSession onComplete={(r) => handleComplete('jam', r)} />}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : navigate('/test-portal')}
          disabled={isSubmitting || isGeneratingReport}
        >
          <ArrowLeft size={16} /> {currentStep > 0 ? 'Previous' : 'Back to Portal'}
        </button>
        {canProceed() && (
          <button 
            className="btn btn-primary" 
            onClick={goToNext}
            disabled={isSubmitting || isGeneratingReport}
          >
            {isSubmitting || isGeneratingReport ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                {isGeneratingReport ? 'Generating Report...' : 'Processing...'}
              </>
            ) : (
              currentStep < 2 ? <>Next Assessment <ArrowRight size={16} /></> : <>Finish & Get Report <Trophy size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}