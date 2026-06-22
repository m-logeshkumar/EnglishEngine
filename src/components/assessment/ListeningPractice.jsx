import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { analyzeListening } from '../../services/aiService';
import { getListeningItems } from '../../services/dataService';
import { Mic, Square, RotateCcw, Send, Headphones, Loader2, Play, Pause, Volume2, RefreshCw, AlertCircle } from 'lucide-react';

export default function ListeningPractice({ onComplete }) {
  const [item, setItem] = useState(null);
  const [items, setItems] = useState([]);
  const [phase, setPhase] = useState('listen'); // listen, record, result
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [error, setError] = useState(null);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);
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

  // Load listening items
  useEffect(() => {
    let isMounted = true;
    
    async function loadItems() {
      try {
        setIsLoadingItems(true);
        setError(null);
        const loaded = await getListeningItems();
        if (!isMounted) return;
        
        setItems(Array.isArray(loaded) ? loaded : []);
        if (Array.isArray(loaded) && loaded.length > 0) {
          const randomIndex = Math.floor(Math.random() * loaded.length);
          setItem(loaded[randomIndex]);
        } else {
          setError('No listening exercises available. Please refresh the page.');
        }
      } catch (err) {
        console.error('Failed to load listening items:', err);
        if (isMounted) {
          setError('Failed to load listening exercises. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingItems(false);
        }
      }
    }

    loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const playAudio = useCallback(() => {
    if (!item?.text) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    // Cancel any existing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    utterance.onend = () => { 
      setIsPlaying(false); 
      setPlayCount(p => p + 1); 
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setError('Failed to play audio. Please try again.');
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [item, isPlaying]);

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

  const handleSubmit = useCallback(async () => {
    if (!transcript || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    setAnalyzing(true);
    setPhase('result');
    
    try {
      const res = await analyzeListening(transcript, item?.text || '');
      if (!mountedRef.current) return;
      
      setResult(res);
      if (onComplete) onComplete(res);
    } catch (err) {
      console.error('Listening analysis failed:', err);
      if (mountedRef.current) {
        setError('Failed to analyze your listening. Please try again.');
        setPhase('record');
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (mountedRef.current) {
        setAnalyzing(false);
        setIsSubmitting(false);
      }
    }
  }, [transcript, isSubmitting, item, onComplete]);

  const handleReset = useCallback(() => {
    clearRecording();
    resetTranscript();
    setResult(null);
    setPhase('listen');
    setError(null);
    setRetryCount(0);
    if (items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length);
      setItem(items[randomIndex]);
    }
    setPlayCount(0);
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [clearRecording, resetTranscript, items]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setPhase('listen');
    if (items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length);
      setItem(items[randomIndex]);
    }
    setPlayCount(0);
  }, [items]);

  if (isLoadingItems) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Loading listening exercises...</p>
      </div>
    );
  }

  if (error && !item && !isLoadingItems) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--accent-rose)', marginBottom: 16 }} />
        <h3 style={{ marginBottom: 12 }}>Unable to Load Listening Exercises</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={handleReset}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>No listening exercises available.</p>
        <button className="btn btn-primary" onClick={handleReset}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2><Headphones size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Listening Practice</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Listen carefully, then speak what you heard</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge badge-${item.difficulty === 'Intermediate' ? 'amber' : 'emerald'}`}>
            {item.difficulty || 'Beginner'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} disabled={isSubmitting}>
            <RefreshCw size={14} /> New Audio
          </button>
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

      {/* Audio Player */}
      <div className="recorder-container" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 4 }}>{item.title || 'Listening Exercise'}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Played {playCount} time{playCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          className={`recorder-btn ${isPlaying ? 'recording' : 'idle'}`} 
          onClick={playAudio}
          disabled={isSubmitting || analyzing}
          style={{ 
            background: isPlaying ? 'var(--accent-emerald)' : undefined,
            opacity: (isSubmitting || analyzing) ? 0.5 : 1,
            cursor: (isSubmitting || analyzing) ? 'not-allowed' : 'pointer',
          }}>
          {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 4 }} />}
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 12 }}>
          {isPlaying ? 'Playing audio... Listen carefully' : 'Click to play the audio passage'}
        </p>
        {isPlaying && (
          <div className="waveform-container">
            {[...Array(10)].map((_, i) => <div key={i} className="waveform-bar" style={{ background: 'var(--accent-emerald)' }} />)}
          </div>
        )}
        {phase === 'listen' && playCount > 0 && (
          <button 
            className="btn btn-primary" 
            style={{ marginTop: 20 }} 
            onClick={() => setPhase('record')}
            disabled={isSubmitting || analyzing}
          >
            <Mic size={18} /> Ready to Speak
          </button>
        )}
      </div>

      {/* Recording Phase */}
      {phase === 'record' && (
        <div className="recorder-container">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Now speak what you heard:</p>
          {isRecording && (
            <div className="waveform-container">
              {[...Array(10)].map((_, i) => <div key={i} className="waveform-bar" />)}
            </div>
          )}
          <button 
            className={`recorder-btn ${isRecording ? 'recording' : 'idle'}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isSubmitting || analyzing}
            style={{
              opacity: (isSubmitting || analyzing) ? 0.5 : 1,
              cursor: (isSubmitting || analyzing) ? 'not-allowed' : 'pointer',
            }}>
            {isRecording ? <Square size={28} /> : <Mic size={28} />}
          </button>
          <div className="recorder-timer">{formatDuration(duration)}</div>

          {audioUrl && (
            <div style={{ marginTop: 16 }}>
              <audio controls src={audioUrl} style={{ width: '100%', height: 40 }} />
            </div>
          )}
          {transcript && (
            <div style={{ marginTop: 16, textAlign: 'left', padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Your transcript:</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{transcript}</p>
            </div>
          )}
          <div className="recorder-controls">
            {audioBlob && !analyzing && (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { clearRecording(); resetTranscript(); }}
                  disabled={isSubmitting}
                >
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
        </div>
      )}

      {/* Analyzing */}
      {analyzing && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>AI is analyzing your listening skills...</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="result-section" style={{ marginTop: 24 }}>
          <div className="glass-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="overall-score">{result.overallScore || 0}</div>
              <p style={{ color: 'var(--text-secondary)' }}>Listening Score</p>
              <span className={`performance-badge ${String(result.performanceLevel || 'Beginner').toLowerCase()}`}>
                {result.performanceLevel || 'Beginner'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Listening', score: result.listeningScore || 0, color: '#3b82f6' },
                { label: 'Accuracy', score: result.accuracy || 0, color: '#10b981' },
                { label: 'Pronunciation', score: result.pronunciation || 0, color: '#8b5cf6' },
                { label: 'Fluency', score: result.fluency || 0, color: '#06b6d4' },
                { label: 'Memory', score: result.memoryRetention || 0, color: '#f59e0b' },
                { label: 'Clarity', score: result.speechClarity || 0, color: '#ec4899' },
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