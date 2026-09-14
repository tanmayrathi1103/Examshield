import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ShieldAlert, Video, Mic, Wifi, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, 
  HelpCircle, Eye, Shield, Smartphone, Globe, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamAttempt } from '../hooks/useExamAttempt';
import { useExamTimer } from '../hooks/useExamTimer';
import { useAutoSave } from '../hooks/useAutoSave';
import { useQuestionNavigation } from '../hooks/useQuestionNavigation';
import { examsApi } from '../api/exams';
import { questionsApi } from '../api/questions';
import { attemptsApi } from '../api/attempts';
import { useApp } from '../context/AppContext';
import { useBiometrics } from '../hooks/useBiometrics';
import { useProctoringMonitor } from '../hooks/useProctoringMonitor';
import { useExamWebSocket } from '../hooks/useExamWebSocket';
import type { ExamResponse, QuestionResponse } from '../types';

const playWarningBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // AudioContext ignored if unallowed by user policy
  }
};

const LiveExam: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();

  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [isExamFullscreen, setIsExamFullscreen] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active floating toast notification state
  const [activeToast, setActiveToast] = useState<{
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  } | null>(null);

  // App & Biometric hooks
  const { addViolation, violations: globalViolations, setActiveExamId, setIsSidebarCollapsed } = useApp();

  // Ensure sidebar is always closed when entering an active examination session
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, [setIsSidebarCollapsed]);
  const {
    videoRef,
    cameraActive,
    startCamera,
    stopCamera,
    captureFrame
  } = useBiometrics();

  // Real hooks
  const { attempt, setAttempt, startOrResume, submitAttempt } = useExamAttempt(examId || undefined, undefined);
  const { saveAnswer } = useAutoSave(attempt?.id);

  // Load Exam and Questions, then Start Attempt
  useEffect(() => {
    const init = async () => {
      if (!examId) {
        navigate('/student/dashboard');
        return;
      }
      try {
        setLoading(true);
        setActiveExamId(examId);
        // 1. Fetch Exam Details
        const examData = await examsApi.studentGetExam(examId);
        setExam(examData);
        // 2. Fetch Questions
        const questionsData = await questionsApi.listQuestionsForExam(examId);
        setQuestions(questionsData.items);
        // 3. Start or Resume Attempt
        await startOrResume();
        
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        if (detail === 'FACE_VERIFICATION_REQUIRED' || (typeof detail === 'string' && detail.includes('FACE_VERIFICATION_REQUIRED'))) {
          navigate(`/student/exam/${examId}/face-verification`);
          return;
        }
        setError(typeof detail === 'string' ? detail : err.message || "Failed to initialize exam");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [examId, navigate]); // Intentionally omitting startOrResume from deps to run once

  // Webcam proctoring and face detection lifecycle
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const { 
    monitoringStatus, facesDetected, framesAnalyzed, lastEvent, headPose, eyeTracking, detectedObjects,
    audioVolume, isVoiceDetected 
  } = useProctoringMonitor(
    examId,
    attempt?.id,
    cameraActive,
    captureFrame
  );

  // Central Telemetry Event Logger & Local Violation Trigger
  const logExamTelemetryEvent = React.useCallback(async (
    eventType: string, 
    eventData: any = {}, 
    typeName?: string, 
    severity: 'low' | 'medium' | 'high' = 'high'
  ) => {
    if (!attempt?.id) return;
    try {
      await attemptsApi.logEvent(attempt.id, {
        event_type: eventType,
        event_data: { ...eventData, severity: severity.toUpperCase() }
      });
    } catch (e) {
      console.error(`Failed to log telemetry event ${eventType}`, e);
    }
    if (typeName) {
      addViolation(typeName as any, severity, attempt.id);
    }
  }, [attempt?.id, addViolation]);

  // 1. Telemetry event listener: tab switching (focus loss & visibility change)
  useEffect(() => {
    if (!attempt?.id) return;

    let lastBlurTime = 0;
    const handleBlur = () => {
      const now = Date.now();
      if (now - lastBlurTime > 5000) {
        lastBlurTime = now;
        logExamTelemetryEvent('tab_switched', { reason: 'window_blur' }, 'Tab Switched', 'high');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastBlurTime > 5000) {
          lastBlurTime = now;
          logExamTelemetryEvent('tab_switched', { reason: 'visibility_hidden' }, 'Tab Switched', 'high');
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attempt?.id, logExamTelemetryEvent]);

  // 2. Telemetry event listener: Fullscreen toggle & lock enforcement
  useEffect(() => {
    if (!attempt?.id) return;

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsExamFullscreen(isFull);
      if (!isFull) {
        logExamTelemetryEvent('fullscreen_exited', { timestamp: new Date().toISOString() }, 'Fullscreen Exited', 'high');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [attempt?.id, logExamTelemetryEvent]);

  // 3. Telemetry event listener: Copy/Paste & Context Menu (Right Click) Prevention
  useEffect(() => {
    if (!attempt?.id) return;

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logExamTelemetryEvent('copy_paste_attempt', { action: e.type }, 'Copy Paste Attempt', 'high');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logExamTelemetryEvent('context_menu_attempt', { action: 'contextmenu' }, 'Right Click Attempt', 'medium');
    };

    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [attempt?.id, logExamTelemetryEvent]);

  const {
    activeIndex,
    goToNext,
    goToPrevious,
    jumpTo,
    isFirst,
    isLast
  } = useQuestionNavigation(questions.length);

  // Timer logic
  const handleExpire = async () => {
    if (attempt?.status === 'in_progress' || attempt?.status === 'paused') {
      await submitAttempt();
      navigate(`/student/exam/${examId}/result?attemptId=${attempt?.id}`);
    }
  };

  const { formattedTime, timeRemaining } = useExamTimer(attempt?.expires_at, handleExpire);

  // Real-time WebSocket handler for remote proctor commands & announcements
  const handleStudentWsMessage = React.useCallback((msg: any) => {
    if (!msg || !msg.type) return;

    if (msg.type === 'STATUS_CHANGED') {
      const nextStatus = msg.status;
      setAttempt(prev => prev ? { ...prev, status: nextStatus } : prev);
      if (nextStatus === 'paused') {
        playWarningBeep();
      }
    } else if (msg.type === 'FORCE_SUBMITTED') {
      navigate(`/student/exam/${examId}/result?attemptId=${attempt?.id}`);
    } else if (msg.type === 'ANNOUNCEMENT' || msg.type === 'PROCTOR_ANNOUNCEMENT') {
      const text = msg.text || msg.message || 'Announcement from proctor';
      const sender = msg.sender || 'Proctor';
      addViolation('Announcement' as any, 'medium', attempt?.id);
      playWarningBeep();
      setActiveToast({
        id: `ann_${Date.now()}`,
        type: `Announcement from ${sender}`,
        message: text,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    } else if (msg.type === 'WARNING' || msg.type === 'PROCTOR_WARNING') {
      const text = msg.text || msg.message || 'Warning from proctor';
      addViolation('Proctor Warning' as any, 'high', attempt?.id);
      playWarningBeep();
      setActiveToast({
        id: `warn_${Date.now()}`,
        type: 'Proctor Warning Issued',
        message: text,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
  }, [examId, attempt?.id, navigate, setAttempt, addViolation]);

  const studentWsPath = examId && attempt?.id ? `/api/v1/ws/exam/${examId}/student/${attempt.id}` : '';
  const { isConnected: isWsConnected } = useExamWebSocket({
    path: studentWsPath,
    enabled: !!(examId && attempt?.id),
    onMessage: handleStudentWsMessage
  });

  // Background fallback synchronization every 30 seconds
  useEffect(() => {
    if (!attempt?.id) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await attemptsApi.getAttempt(attempt.id);
        if (fresh.status !== attempt.status) {
          setAttempt(fresh);
          if (fresh.status === 'auto_submitted' || fresh.status === 'submitted') {
            navigate(`/student/exam/${examId}/result?attemptId=${attempt.id}`);
          }
        }
      } catch (e) {
        // ignore background poll errors
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [attempt?.id, attempt?.status, examId, navigate, setAttempt]);


  // Filter violations strictly for current attempt session (ignores mock data from other exams/students)
  const examViolations = React.useMemo(() => {
    if (!attempt?.id) return [];
    return globalViolations.filter(v => v.attemptId === attempt.id);
  }, [globalViolations, attempt?.id]);

  // Trigger floating alert toast and audio chime whenever a new violation is logged
  const prevViolationsLenRef = React.useRef(0);
  useEffect(() => {
    if (examViolations.length > prevViolationsLenRef.current) {
      const latest = examViolations[0];
      if (latest) {
        playWarningBeep();
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 2000);
        let message = 'Unusual system event detected. Please maintain proper exam focus.';
        if (latest.type === 'Tab Switched') message = 'Switching browser tabs is strictly monitored. Please stay on the exam screen.';
        else if (latest.type === 'Eye Deviation') message = 'Gaze deviation detected. Please keep your eyes focused directly on the exam.';
        else if (latest.type === 'Face Missing') message = 'Your face was not visible in the camera frame. Please face the webcam directly.';
        else if (latest.type === 'Multiple Faces') message = 'Multiple people detected in camera feed. Only candidate is allowed.';
        else if (latest.type === 'Voice Detected') message = 'Ambient speech/voices detected. Please maintain total silence.';
        else if (latest.type === 'Phone Detected') message = 'Mobile phone detected in frame. Prohibited items will invalidate attempt.';
        else if (latest.type === 'Face Mismatch') message = 'Candidate mismatch detected! Person in frame does not match registered student profile.';
        else if (latest.type === 'Camera Disconnected') message = 'Webcam feed disconnected or unreadable. Please check camera permissions.';
        else if (latest.type === 'Fullscreen Exited') message = 'Leaving fullscreen mode is recorded as a violation. Click button to re-lock.';
        else if (latest.type === 'Copy Paste Attempt') message = 'Copying or pasting content is strictly disabled during the exam.';
        else if (latest.type === 'Right Click Attempt') message = 'Right-click context menu is prohibited during active assessment.';

        setActiveToast({
          id: latest.id,
          type: latest.type,
          message,
          severity: latest.severity,
          timestamp: latest.timestamp
        });
      }
    }
    prevViolationsLenRef.current = examViolations.length;
  }, [examViolations]);

  // Auto-dismiss active toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !exam || !attempt) {
    const isAlreadyCompleted = error && (error.includes("already submitted") || error.includes("already auto_submitted") || error.includes("already evaluated"));
    
    if (isAlreadyCompleted) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl text-center space-y-6 max-w-md w-full backdrop-blur-md">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Exam Already Completed</h2>
              <p className="text-slate-400 text-sm">You have already submitted this examination and cannot retake it.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => navigate('/student/dashboard')} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-sm transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl text-center space-y-6 max-w-md w-full backdrop-blur-md">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Error Loading Exam</h2>
            <p className="text-slate-400 text-sm">{error || "Attempt could not be initialized"}</p>
          </div>
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-bold rounded-xl text-sm transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Answer selection handler
  const handleSelectOption = (qId: string, optText: string) => {
    setAutoSaving(true);
    
    // Optimistic update
    if (attempt) {
      const newAnswers = attempt.answers.map(a => 
        a.question_id === qId ? { ...a, selected_option: optText, is_answered: true } : a
      );
      setAttempt({ ...attempt, answers: newAnswers, answered_questions: newAnswers.filter(a => a.is_answered).length });
    }

    saveAnswer(qId, { selected_option: optText }, () => setAutoSaving(false), () => setAutoSaving(false));
  };

  const handleClearResponse = (qId: string) => {
    setAutoSaving(true);
    
    if (attempt) {
      const newAnswers = attempt.answers.map(a => 
        a.question_id === qId ? { ...a, selected_option: undefined, is_answered: false } : a
      );
      setAttempt({ ...attempt, answers: newAnswers, answered_questions: newAnswers.filter(a => a.is_answered).length });
    }

    // Need an endpoint to clear answer, or sending empty strings
    saveAnswer(qId, { selected_option: "" }, () => setAutoSaving(false), () => setAutoSaving(false));
  };

  const handleSubmitExam = async () => {
    setShowSubmitModal(false);
    await submitAttempt();
    navigate(`/student/exam/${examId}/result?attemptId=${attempt.id}`);
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsExamFullscreen(false);
  };

  const handleEnterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setIsExamFullscreen(true);
  };

  const activeQuestion = questions[activeIndex];
  const examViolationsCount = examViolations.length;
  const studentAnswersMap = new Map(attempt.answers.map(a => [a.question_id, a]));
  const answeredCount = attempt.answered_questions;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-6 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Header bar */}
      <header className="flex justify-between items-center py-4 px-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl mb-6 backdrop-blur-md">
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{exam.exam_code || 'EXAM'}</div>
          <h2 className="text-lg font-bold tracking-tight text-white">{exam.title}</h2>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Interactive Session Violations Badge */}
          <button 
            onClick={() => setShowViolationsModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              examViolationsCount > 0 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
            title="Click to view all session warnings & violations"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{examViolationsCount} {examViolationsCount === 1 ? 'Violation' : 'Violations'} Logged</span>
          </button>

          {/* Fullscreen Toggle / Indicator */}
          <button 
            onClick={isExamFullscreen ? handleExitFullscreen : handleEnterFullscreen}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isExamFullscreen 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
            }`}
          >
            <Shield className="w-4 h-4" />
            {isExamFullscreen ? '🔒 Fullscreen Locked' : '⚠️ Lock Escaped! Click to Re-lock'}
          </button>

          {/* Real-Time WebSocket Link Badge */}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
            isWsConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {isWsConnected ? '⚡ Real-Time Proctor Link' : 'Connecting Proctor Link...'}
          </span>

          {/* Autosave Status */}
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${autoSaving ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'}`} />
            {autoSaving ? 'Saving response...' : 'All changes saved'}
          </span>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span className={`font-extrabold text-sm font-mono ${timeRemaining && timeRemaining < 300 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {formattedTime}
            </span>
          </div>
        </div>
      </header>

      {/* Prominent High-Visibility Warning Banner for Real-Time Violations */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className={`mb-6 p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 backdrop-blur-lg ${
              activeToast.severity === 'high' 
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200' 
                : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${activeToast.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'} animate-bounce`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wider text-white">⚠️ PROCTOR WARNING: {activeToast.type}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-slate-300 font-bold border border-slate-700">
                    {new Date(activeToast.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {activeToast.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowViolationsModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 transition-colors"
              >
                View Log ({examViolationsCount})
              </button>
              <button
                onClick={() => setActiveToast(null)}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-xs font-bold text-white rounded-xl transition-colors shadow-sm"
              >
                Dismiss Alert ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main proctoring layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
        
        {/* Left Side: Proctoring Feed Panel */}
        <div className="space-y-6 hidden lg:block">
          {/* Live webcam feed & detection status */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden relative shadow-lg">
            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-slate-400">
                  <Video className="w-8 h-8 animate-pulse text-slate-500 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activating Proctor Feed...</span>
                </div>
              )}

              {/* Dynamic Overlay HUD guides on top of video or placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                <div className="w-32 h-32 border-2 border-dashed border-emerald-500/60 rounded-full flex items-center justify-center relative animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/40" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500/40" />
                  <div className="absolute -top-1.5 px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[8px] font-black rounded uppercase tracking-wider">
                    Face Locked
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-slate-300">
                PROCTOR FEED • LIVE
              </div>
            </div>

            <div className="p-4 bg-slate-850/50 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Eye className="w-4 h-4 text-emerald-400" />
                <div><div className="text-[10px] text-slate-400 uppercase">Eye Contact</div><div className="text-slate-200">Maintained</div></div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Video className="w-4 h-4 text-emerald-400" />
                <div><div className="text-[10px] text-slate-400 uppercase">Face Count</div><div className="text-slate-200">{cameraActive ? (facesDetected ?? "1") + " Detected" : "0 Detected"}</div></div>
              </div>
            </div>

            {/* Mic Volume & Voice Detection HUD */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-700/50 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Mic className={`w-3.5 h-3.5 ${isVoiceDetected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                  Mic Level: {audioVolume}%
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                  isVoiceDetected ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isVoiceDetected ? 'VOICE DETECTED' : 'QUIET'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-150 ${
                    audioVolume >= 35 ? 'bg-rose-500' : audioVolume >= 20 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, audioVolume)}%` }}
                />
              </div>
            </div>

            {/* Development-Only Debug Panel */}
            <div className="mt-4 p-4 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-mono space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-700 pb-1 mb-2">DEBUG: AI MONITORING</div>
              <div>Status: <span className={monitoringStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}>{monitoringStatus}</span></div>
              <div>Camera: {cameraActive ? 'Connected' : 'Disconnected'}</div>
              <div>Mic Level: {audioVolume}% {isVoiceDetected ? '(VOICE DETECTED)' : ''}</div>
              <div>Faces Detected: {facesDetected !== null ? facesDetected : 'N/A'}</div>
              <div>Head Direction: {headPose?.direction || 'UNKNOWN'}</div>
              <div>Objects: {detectedObjects && detectedObjects.length > 0 ? detectedObjects.map(o => `${o.label} (${Math.round(o.confidence * 100)}%)`).join(', ') : 'None'}</div>
              <div>Frames Analyzed: {framesAnalyzed}</div>
              <div>Last Event: {lastEvent}</div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 flex justify-between items-center">
              <span>Proctoring Alert log</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${examViolations.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {examViolations.length} Warnings
              </span>
            </h3>
            {examViolations.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No behavioral incidents flagged. Academic integrity secure.</div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {examViolations.map((v) => (
                  <div key={v.id} className="p-2 bg-slate-900/60 rounded-lg border border-slate-750 text-[10px] flex justify-between items-center text-slate-350">
                    <span className="font-bold text-rose-400">{v.type}</span>
                    <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Active Question box */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 flex-grow flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Question {activeIndex + 1} of {questions.length}</span>
                <span className="text-xs bg-slate-700 border border-slate-650 px-2 py-1 rounded font-bold">{activeQuestion?.marks} Points</span>
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-bold leading-relaxed text-white">
                {activeQuestion?.question_text}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-3">
                {activeQuestion?.options?.map((option, index) => {
                  const currentAnswer = studentAnswersMap.get(activeQuestion.id);
                  const isSelected = currentAnswer?.selected_option === option.option_text;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(activeQuestion.id, option.option_text)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between font-semibold ${
                        isSelected 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-900/20 border-slate-700 hover:border-slate-500 hover:bg-slate-800/25 text-slate-300'
                      }`}
                    >
                      <span>{option.option_text}</span>
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                        isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-700/50">
              <button 
                onClick={goToPrevious}
                disabled={isFirst}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button 
                onClick={() => handleClearResponse(activeQuestion.id)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Response
              </button>

              <button 
                onClick={goToNext}
                disabled={isLast}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Question Navigation Palette */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between h-full">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2">
                Question Palette
              </h3>

              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2">
                {questions.map((q, idx) => {
                  const answer = studentAnswersMap.get(q.id);
                  const isAnswered = answer?.is_answered;
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpTo(idx)}
                      className={`h-10 rounded-lg text-xs font-bold transition-all border flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30' 
                          : isAnswered 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-slate-900/40 border-slate-750 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-slate-700/50 pt-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-indigo-600 border border-indigo-400 block" />
                  <span>Active Item</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 block" />
                  <span>Answered / Saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-900/40 border border-slate-750 block" />
                  <span>Not Answered</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700/50 mt-6">
              <button 
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-rose-600/20 transition-all hover:-translate-y-0.5"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Submit Confirmation Dialog Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-2xl"
            >
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-black text-white">Submit Examination?</h3>
                <p className="text-xs text-slate-400">
                  Ensure all questions are reviewed. You answered {answeredCount} out of {questions.length} questions.
                </p>
              </div>

              {examViolationsCount > 0 && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    Proctoring logged {examViolationsCount} behavioral warnings. Submission will include biometric auditing metadata.
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-750 text-slate-300 font-bold hover:bg-slate-700 rounded-xl text-xs transition-colors"
                >
                  Return to Exam
                </button>
                <button 
                  onClick={handleSubmitExam}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/15"
                >
                  Yes, Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Toast Alert for Real-Time Violations & Proctor Announcements */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-40 max-w-sm w-full bg-slate-900/95 border ${
              activeToast.severity === 'high' ? 'border-rose-500/50' : 'border-amber-500/50'
            } rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-2.5 text-white`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-xs">
                <AlertTriangle className={`w-4 h-4 ${activeToast.severity === 'high' ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
                <span className={activeToast.severity === 'high' ? 'text-rose-400' : 'text-amber-300'}>
                  {activeToast.type}
                </span>
              </div>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors"
              >
                ✕ Dismiss
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-200 font-medium leading-snug">
                {activeToast.message}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block pt-1">
                {new Date(activeToast.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-center">
              💡 Correct this behavior to ensure high integrity score.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Flash Visual Alert Overlay on Violation */}
      {screenFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 border-8 border-rose-500/80 bg-rose-500/10 transition-all animate-pulse" />
      )}

      {/* Session Violations & Warnings History Modal */}
      <AnimatePresence>
        {showViolationsModal && (
          <div className="fixed inset-0 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-6 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-extrabold text-white">Session Violations Log</h3>
                </div>
                <button
                  onClick={() => setShowViolationsModal(false)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                >
                  Close ✕
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {examViolations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    🎉 Excellent! No proctoring warnings or violations logged for this active attempt session.
                  </div>
                ) : (
                  examViolations.map((v) => (
                    <div key={v.id} className="p-3.5 bg-slate-800/60 border border-slate-750 rounded-2xl flex justify-between items-start text-xs space-y-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-rose-300">{v.type}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            v.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {v.type === 'Tab Switched' && 'Switching browser tabs or focus loss detected.'}
                          {v.type === 'Eye Deviation' && 'Candidate gaze deviation detected.'}
                          {v.type === 'Face Missing' && 'Candidate face not visible in camera frame.'}
                          {v.type === 'Multiple Faces' && 'Multiple faces detected in camera feed.'}
                          {v.type === 'Voice Detected' && 'Speech or ambient noise detected.'}
                          {v.type === 'Phone Detected' && 'Cellular device detected in frame.'}
                          {v.type === 'Camera Disconnected' && 'Webcam stream interrupted or disabled.'}
                          {v.type === 'Fullscreen Exited' && 'Candidate exited full screen mode.'}
                          {v.type === 'Copy Paste Attempt' && 'Content copy or paste attempt intercepted.'}
                          {v.type === 'Right Click Attempt' && 'Right click context menu attempt.'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-300 text-center font-medium">
                💡 Maintaining proper exam etiquette ensures your integrity score remains high.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remote Proctor Suspension Overlay */}
      {attempt?.status === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-8 rounded-3xl text-center space-y-4 text-white shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Ban className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-amber-400 tracking-tight">Assessment Temporarily Suspended</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your exam session has been suspended by the proctor. Please remain seated and face the webcam. The assessment will resume automatically when re-activated.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Telemetry Status: Monitoring Active • Standby
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveExam;
