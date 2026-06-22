import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { analyzeJAM } from '../../services/aiService';
import { getTopics } from '../../services/dataService';
import { Mic, Square, RotateCcw, Send, MessageSquare, Loader2, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';

export default function JamSession({ onComplete }) {
  const [topic, setTopic] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const synthRef = useRef(null);
  const mountedRef = useRef(true);
  
  const { isRecording, audioBlob, audioUrl, duration, startRecording, stopRecording, clearRecording, formatDuration } = useAudioRecorder();
  const { transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Cleanup speech recognition
      stopListening();
    };
  }, [stopListening]);

  // Load topics
  useEffect(() => {
    let isMounted = true;
    
    async function loadTopics() {
      try {
        setIsLoadingTopics(true);
        setError(null);
        const loaded = await getTopics();
        if (!isMounted) return;
        
        setTopics(Array.isArray(loaded) ? loaded : []);
        if (Array.isArray(loaded) && loaded.length > 0) {
          const randomIndex = Math.floor(Math.random() * loaded.length);
          setTopic(loaded[randomIndex]);
        } else {
          setError('No topics available. Please refresh the page.');
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
        if (isMounted) {
          setError('Failed to load topics. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingTopics(false);
        }
      }
    }

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const pickTopic = useCallback(() => {
    if (topics.length === 0) {
      setError('No topics available. Please refresh the page.');
      return;
    }
    setTopic(topics[Math.floor(Math.random() * topics.length)]);
    setResult(null);
    setError(null);
    setHasSubmitted(false);
    setRetryCount(0);
  }, [topics]);

  const handleStartRecording = useCallback(async () => {
    setError(null);
    resetTranscript();
    await startRecording();
    startListening();
  }, [startRecording, startListening, resetTranscript]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stopListening();
  }, [stopRecording, stopListening]);

  const handleReset = useCallback(() => {
    clearRecording();
    resetTranscript();
    setResult(null);
    setError(null);
    setHasSubmitted(false);
    setRetryCount(0);
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [clearRecording, resetTranscript]);

  const handleSubmit = useCallback(async () => {
    if (!transcript || isSubmitting || hasSubmitted) return;
    
    setIsSubmitting(true);
    setError(null);
    setAnalyzing(true);
    
    try {
      const res = await analyzeJAM(transcript, topic?.title || '');
      if (!mountedRef.current) return;
      
      setResult(res);
      setHasSubmitted(true);
      if (onComplete) onComplete(res);
    } catch (err) {
      console.error('JAM analysis failed:', err);
      if (mountedRef.current) {
        setError('Failed to analyze your speaking. Please try again.');
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (mountedRef.current) {
        setAnalyzing(false);
        setIsSubmitting(false);
      }
    }
  }, [transcript, isSubmitting, hasSubmitted, topic, onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    handleReset();
  }, [handleReset]);

  if (isLoadingTopics) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-purple)' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Loading topics...</p>
      </div>
    );
  }

  if (error && !topic && !isLoadingTopics) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--accent-rose)', marginBottom: 16 }} />
        <h3 style={{ marginBottom: 12 }}>Unable to Load Topics</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={pickTopic}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>No topics available.</p>
        <button className="btn btn-primary" onClick={pickTopic}>
          <RefreshCw size={16} /> Refresh Topics
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2><MessageSquare size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Just A Minute (JAM)</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Speak freely on the given topic</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 16, borderColor: 'var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-rose)' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
            {retryCount < 3 && (
              <button className="btn btn-ghost btn-sm" onClick={handleRetry} style={{ marginLeft: 'auto' }}>
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Topic Card */}
      <div className="topic-card">
        <h3>Your Topic</h3>
        <div className="topic-name">{topic.title || 'No topic selected'}</div>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem' }}>{topic.description || ''}</p>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => { pickTopic(); handleReset(); }} 
          style={{ marginTop: 16 }}
          disabled={isSubmitting || analyzing}
        >
          <RefreshCw size={14} /> Get New Topic
        </button>
      </div>

      {/* Tips */}
      <div style={{ padding: 16, background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Lightbulb size={20} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Tips:</strong> Speak naturally, use varied vocabulary, structure your thoughts (intro → body → conclusion), and maintain a steady pace. There's no time limit!
        </div>
      </div>

      {/* Recorder */}
      <div className="recorder-container">
        {isRecording && (
          <div className="waveform-container">
            {[...Array(10)].map((_, i) => <div key={i} className="waveform-bar" style={{ background: 'var(--accent-purple)' }} />)}
          </div>
        )}
        <button 
          className={`recorder-btn ${isRecording ? 'recording' : 'idle'}`}
          onClick={isRecording ? handleStopRecording : handleStartRecording} 
          disabled={analyzing || isSubmitting || hasSubmitted}
          style={{ 
            background: isRecording ? undefined : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            opacity: (analyzing || isSubmitting || hasSubmitted) ? 0.5 : 1,
            cursor: (analyzing || isSubmitting || hasSubmitted) ? 'not-allowed' : 'pointer',
          }}>
          {isRecording ? <Square size={28} /> : <Mic size={28} />}
        </button>
        <div className="recorder-timer">{formatDuration(duration)}</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
          {isRecording ? 'Speaking... Click to stop' : audioBlob ? 'Recording complete' : 'Click to start speaking'}
        </p>

        {audioUrl && (
          <div style={{ marginTop: 16 }}>
            <audio controls src={audioUrl} style={{ width: '100%', height: 40 }} />
          </div>
        )}
        
        {transcript && (
          <div style={{ marginTop: 16, textAlign: 'left', padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', maxHeight: 150, overflowY: 'auto' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Your speech ({transcript.split(/\s+/).length} words):</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{transcript}</p>
          </div>
        )}
        
        <div className="recorder-controls">
          {audioBlob && !analyzing && !hasSubmitted && (
            <>
              <button className="btn btn-secondary" onClick={handleReset} disabled={isSubmitting}>
                <RotateCcw size={16} /> Re-record
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit} 
                disabled={!transcript || isSubmitting}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                {isSubmitting ? ' Submitting...' : ' Submit'}
              </button>
            </>
          )}
        </div>
        
        {analyzing && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-purple)' }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>AI is analyzing your speaking...</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="result-section" style={{ marginTop: 32 }}>
          <div className="glass-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="overall-score">{result.overallScore || 0}</div>
              <p style={{ color: 'var(--text-secondary)' }}>Speaking Score</p>
              <span className={`performance-badge ${String(result.performanceLevel || 'Beginner').toLowerCase()}`}>
                {result.performanceLevel || 'Beginner'}
              </span>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <span className="badge badge-blue">{result.wordCount || 0} words</span>
                <span className="badge badge-purple">{result.vocabLevel || 'Basic'} vocabulary</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Fluency', score: result.fluency || 0, color: '#3b82f6' },
                { label: 'Vocabulary', score: result.vocabulary || 0, color: '#10b981' },
                { label: 'Grammar', score: result.grammar || 0, color: '#8b5cf6' },
                { label: 'Confidence', score: result.confidence || 0, color: '#f59e0b' },
                { label: 'Topic Relevance', score: result.topicRelevance || 0, color: '#06b6d4' },
                { label: 'Speaking Flow', score: result.speakingFlow || 0, color: '#ec4899' },
                { label: 'Idea Clarity', score: result.ideaClarity || 0, color: '#f43f5e' },
              ].map((s, i) => (
                <div key={i} className="skill-bar">
                  <span className="skill-bar-label">{s.label}</span>
                  <div className="skill-bar-track"><div className="skill-bar-fill" style={{ width: `${Math.min(s.score, 100)}%`, background: s.color }} /></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: s.color, minWidth: 30 }}>{Math.min(s.score, 100)}</span>
                </div>
              ))}
            </div>
            {Array.isArray(result.tips) && result.tips.length > 0 && (
              <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: 12, color: 'var(--accent-amber)' }}>💡 Improvement Tips</h4>
                {result.tips.map((t, i) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
                    • {t}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}