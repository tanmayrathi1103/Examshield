import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Video, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, 
  Clock, BookOpen, AlertCircle, Ban, PlayCircle, Eye, Shield,
  Volume2, VolumeX, Bell, Radio, ExternalLink, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { examsApi } from '../api/exams';
import { useExamWebSocket } from '../hooks/useExamWebSocket';
import type { 
  ExamResponse, 
  LiveExamMonitoringResponse, 
  LiveStudentSessionResponse 
} from '../types';

interface RealtimeAlertItem {
  id: string;
  attempt_id: string;
  student_name: string;
  roll_no?: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  reason?: string;
}

// Web Audio API proctor alert tone
const playProctorAlertChime = (severity: 'low' | 'medium' | 'high' = 'high') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (severity === 'high') {
      // High-urgency proctor chime: 880Hz -> 660Hz -> 880Hz beep sequence
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Medium-urgency chime: 587Hz -> 784Hz pleasant notification
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.debug('Proctor audio chime error:', e);
  }
};

const LiveMonitoring: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExamId = searchParams.get('examId');

  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(urlExamId || '');
  const [monitoringData, setMonitoringData] = useState<LiveExamMonitoringResponse | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [confirmSubmitModal, setConfirmSubmitModal] = useState<boolean>(false);

  // Real-time alerts queue & sound preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlertItem[]>([]);
  const [recentlyAlertedAttempts, setRecentlyAlertedAttempts] = useState<{ [attemptId: string]: number }>({});
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Real-time WebSocket event handler
  const handleWebSocketMessage = useCallback((msg: any) => {
    if (!msg || !msg.type) return;

    if (msg.type === 'VIOLATION_EVENT') {
      const { attempt_id, event_type, severity, timestamp, event_data, student_name, roll_no } = msg;
      const normalizedSeverity: 'low' | 'medium' | 'high' = 
        severity?.toLowerCase() === 'high' ? 'high' : severity?.toLowerCase() === 'low' ? 'low' : 'medium';

      // 1. Play alert chime
      if (soundEnabledRef.current) {
        playProctorAlertChime(normalizedSeverity);
      }

      // 2. Mark attempt as recently alerted for card pulsing effect
      setRecentlyAlertedAttempts(prev => ({
        ...prev,
        [attempt_id]: Date.now()
      }));

      // 3. Extract human-readable reason
      const reason = event_data?.reason || event_data?.object || event_data?.action || undefined;

      // 4. Update session data dynamically
      setMonitoringData(prev => {
        if (!prev) return prev;
        const targetStudent = prev.sessions.find(s => s.attempt_id === attempt_id);
        const resolvedName = student_name || targetStudent?.student_name || 'Student';
        const resolvedRoll = roll_no || targetStudent?.roll_no || undefined;

        // Push to real-time notification toasts queue
        const alertItem: RealtimeAlertItem = {
          id: `alert_${Date.now()}_${Math.random()}`,
          attempt_id,
          student_name: resolvedName,
          roll_no: resolvedRoll,
          event_type,
          severity: normalizedSeverity,
          timestamp: timestamp || new Date().toISOString(),
          reason
        };

        setRealtimeAlerts(currentAlerts => [alertItem, ...currentAlerts.slice(0, 4)]);

        const updatedSessions = prev.sessions.map(s => {
          if (s.attempt_id === attempt_id) {
            const newEvent = {
              id: `ws_${Date.now()}`,
              event_type,
              severity: normalizedSeverity,
              timestamp: timestamp || new Date().toISOString(),
              event_data
            };
            const exactCount = typeof msg.violations_count === 'number' ? msg.violations_count : s.violations_count + 1;
            const updatedIntegrity = Math.max(0, Math.round(100 - (exactCount * 10)));
            return {
              ...s,
              violations_count: exactCount,
              integrity_score: updatedIntegrity,
              recent_events: [newEvent, ...s.recent_events.slice(0, 9)]
            };
          }
          return s;
        });

        // If target student wasn't in sessions yet, trigger quiet re-fetch
        if (!targetStudent) {
          fetchLiveTelemetry(true);
        }

        return { ...prev, sessions: updatedSessions };
      });
    } else if (msg.type === 'SESSION_UPDATED') {
      const { attempt_id, status } = msg;
      setMonitoringData(prev => {
        if (!prev) return prev;
        const updatedSessions = prev.sessions.map(s => {
          if (s.attempt_id === attempt_id) {
            return { ...s, status };
          }
          return s;
        });
        return { ...prev, sessions: updatedSessions };
      });
    } else if (msg.type === 'STUDENT_ONLINE' || msg.type === 'STUDENT_OFFLINE') {
      // Re-fetch quietly to align active counts
      fetchLiveTelemetry(true);
    }
  }, []);

  // Initialize WebSocket connection for the selected exam
  const wsPath = selectedExamId ? `/api/v1/ws/exam/${selectedExamId}/proctor` : '';
  const { isConnected, connectionStatus } = useExamWebSocket({
    path: wsPath,
    enabled: !!selectedExamId,
    onMessage: handleWebSocketMessage
  });

  // 1. Fetch faculty exams to populate exam selector
  useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await examsApi.listExams(0, 100);
        setExams(res.items);
        if (!selectedExamId && res.items.length > 0) {
          const active = res.items.find(e => e.status === 'active' || e.status === 'scheduled');
          const targetId = active ? active.id : res.items[0].id;
          setSelectedExamId(targetId);
          setSearchParams({ examId: targetId });
        }
      } catch (err: any) {
        console.error("Failed to load exams list", err);
      }
    };
    loadExams();
  }, []);

  // 2. Fetch live monitoring data for selected exam
  const fetchLiveTelemetry = useCallback(async (isSilent: boolean = false) => {
    if (!selectedExamId) return;
    try {
      if (!isSilent) setIsRefreshing(true);
      setError(null);
      const data = await examsApi.getLiveMonitoring(selectedExamId);
      setMonitoringData(data);
      
      // Auto-select first session if none currently selected
      if (data.sessions.length > 0) {
        setSelectedAttemptId(prev => {
          if (prev && data.sessions.some(s => s.attempt_id === prev)) {
            return prev;
          }
          return data.sessions[0].attempt_id;
        });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : err.message || 'Failed to fetch live monitoring telemetry');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedExamId]);

  // Initial fetch on exam selection change
  useEffect(() => {
    if (selectedExamId) {
      setLoading(true);
      fetchLiveTelemetry(false);
    }
  }, [selectedExamId, fetchLiveTelemetry]);

  // 3. Fast real-time continuous background sync every 3 seconds (guarantees dynamic updates without refresh)
  useEffect(() => {
    if (!selectedExamId) return;
    const interval = setInterval(() => {
      fetchLiveTelemetry(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedExamId, fetchLiveTelemetry]);

  // Auto dismiss oldest realtime alert after 7 seconds
  useEffect(() => {
    if (realtimeAlerts.length > 0) {
      const timer = setTimeout(() => {
        setRealtimeAlerts(prev => prev.slice(1));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [realtimeAlerts]);

  // Handle switching selected exam
  const handleExamChange = (newExamId: string) => {
    setSelectedExamId(newExamId);
    setSelectedAttemptId(null);
    setSearchParams({ examId: newExamId });
  };

  const activeSession = monitoringData?.sessions.find(s => s.attempt_id === selectedAttemptId);

  // Proctor Actions
  const handleToggleSuspend = async () => {
    if (!selectedExamId || !activeSession) return;
    try {
      setActionLoading(true);
      await examsApi.toggleSuspendAttempt(selectedExamId, activeSession.attempt_id);
      await fetchLiveTelemetry(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update suspension status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceSubmit = async () => {
    if (!selectedExamId || !activeSession) return;
    try {
      setActionLoading(true);
      await examsApi.forceSubmitAttempt(selectedExamId, activeSession.attempt_id);
      setConfirmSubmitModal(false);
      await fetchLiveTelemetry(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to force-submit exam");
    } finally {
      setActionLoading(false);
    }
  };

  const formatEventType = (type: string) => {
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Exam Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Proctor Live Monitoring
            {connectionStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                ⚡ Real-Time WebSocket (&lt;50ms)
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Connecting Stream...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Polling Fallback
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Real-time optical telemetry, behavior logs, and proctor intervention controls.</p>
        </div>

        {/* Controls: Exam Selector, Audio Alerts, & Refresh */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64">
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {exams.length === 0 && <option value="">Loading exams...</option>}
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.exam_code} - {e.title} ({e.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
              soundEnabled 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={soundEnabled ? "Live Sound Alerts Enabled (Click to Mute)" : "Live Sound Alerts Muted (Click to Enable)"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Audio Alerts ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Audio Muted</span>
              </>
            )}
          </button>

          <button
            onClick={() => fetchLiveTelemetry(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center justify-center disabled:opacity-50"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to live exam rooms telemetry...</p>
        </div>
      ) : !monitoringData || monitoringData.sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">No Active Student Sessions</h3>
            <p className="text-sm text-slate-400">
              There are currently no students taking this examination. When assigned students begin the assessment, their live telemetry feeds will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Students Grid (2 Cols on left) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>Active Assessment Rooms ({monitoringData.sessions.length})</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {monitoringData.active_count} In-Progress
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitoringData.sessions.map((session) => {
                const isSelected = selectedAttemptId === session.attempt_id;
                const isPaused = session.status === 'paused';
                const isSubmitted = session.status === 'submitted' || session.status === 'auto_submitted';
                const isRecentlyAlerted = recentlyAlertedAttempts[session.attempt_id] && (Date.now() - recentlyAlertedAttempts[session.attempt_id] < 6000);

                let statusBadge = (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                );

                if (isPaused) {
                  statusBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      Suspended
                    </span>
                  );
                } else if (isSubmitted) {
                  statusBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Submitted
                    </span>
                  );
                }

                let integrityColor = 'text-emerald-500';
                let integrityBarBg = 'bg-emerald-500';
                if (session.integrity_score < 70) {
                  integrityColor = 'text-rose-500';
                  integrityBarBg = 'bg-rose-500';
                } else if (session.integrity_score < 90) {
                  integrityColor = 'text-amber-500';
                  integrityBarBg = 'bg-amber-500';
                }

                return (
                  <button
                    key={session.attempt_id}
                    onClick={() => setSelectedAttemptId(session.attempt_id)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-48 hover:shadow-md transition-all bg-white relative ${
                      isRecentlyAlerted
                        ? 'border-rose-500 ring-4 ring-rose-500/30 shadow-lg animate-pulse bg-rose-50/20'
                        : isSelected 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-800 text-sm">{session.student_name}</h4>
                          {isRecentlyAlerted && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-0.5">
                              ⚡ LIVE ALERT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                          {session.roll_no || 'ID: ' + session.student_id.slice(0, 8)} • {session.department || 'Student'}
                        </p>
                      </div>
                      {statusBadge}
                    </div>

                    {/* Trust Rating Bar */}
                    <div className="w-full space-y-1.5 my-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">Integrity Rating</span>
                        <span className={integrityColor}>
                          {session.integrity_score}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${integrityBarBg}`} 
                          style={{ width: `${Math.min(100, Math.max(0, session.integrity_score))}%` }} 
                        />
                      </div>
                    </div>

                    {/* Telemetry info */}
                    <div className="flex justify-between items-center w-full pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                      <span>{session.violations_count} Violations Logged</span>
                      <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                        <Clock className="w-3 h-3" />
                        {session.answered_questions}/{session.total_questions} Ans
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Student Proctor Feed Panel (Right col) */}
          <div>
            {activeSession ? (
              <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl space-y-6 sticky top-6">
                {/* Header & Biometric Feed */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                          activeSession.status === 'paused' ? 'bg-amber-400' : 'bg-emerald-400'
                        } opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          activeSession.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                      Biometric HUD Feed
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeSession.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative border border-slate-800 overflow-hidden">
                    <div className="w-16 h-16 border-2 border-dashed border-indigo-500 rounded-full flex items-center justify-center text-indigo-400 animate-pulse">
                      <Video className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 mt-2">Active Proctoring Stream</p>
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-slate-300">
                      {activeSession.student_name}
                    </div>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trust Rating</div>
                    <div className={`text-2xl font-black mt-1 ${
                      activeSession.integrity_score >= 90 ? 'text-emerald-400' : activeSession.integrity_score >= 70 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {activeSession.integrity_score}%
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flags Logged</div>
                    <div className="text-2xl font-black text-indigo-400 mt-1">
                      {activeSession.violations_count}
                    </div>
                  </div>
                </div>

                {/* Event Timelines */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Recent Telemetry Logs</span>
                    <span className="text-slate-500">{activeSession.recent_events.length} Events</span>
                  </h4>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeSession.recent_events.length === 0 ? (
                      <div className="text-[10px] text-slate-500 italic text-center py-4">
                        Compliance checked. No warnings recorded.
                      </div>
                    ) : (
                      activeSession.recent_events.map((v) => (
                        <div key={v.id} className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-800 text-[10px] flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${
                              v.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                            }`} />
                            <span className="font-bold text-slate-200 truncate">
                              {formatEventType(v.event_type)}
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono text-[9px] whitespace-nowrap">
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Remote Actions */}
                <div className="space-y-2.5 pt-4 border-t border-slate-800">
                  <button 
                    onClick={handleToggleSuspend}
                    disabled={actionLoading || activeSession.status === 'submitted' || activeSession.status === 'auto_submitted'}
                    className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeSession.status === 'paused'
                        ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                        : 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {activeSession.status === 'paused' ? (
                      <>
                        <PlayCircle className="w-4 h-4" /> Re-activate Assessment
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" /> Suspend Student Assessment
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => setConfirmSubmitModal(true)}
                    disabled={actionLoading || activeSession.status === 'submitted' || activeSession.status === 'auto_submitted'}
                    className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShieldAlert className="w-4 h-4" /> Force Submit Examination
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-300 rounded-3xl text-center text-slate-400 italic">
                Select an active student room to view real-time proctor telemetry.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Force Submit */}
      {confirmSubmitModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Force Submit Examination</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to forcibly submit the examination for <strong className="text-slate-800">{activeSession.student_name}</strong>? This action will evaluate their current answers, terminate the session, and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForceSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Yes, Force Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Dynamic Violation Notification Toasts Queue */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {realtimeAlerts.map((alert) => {
            const isHigh = alert.severity === 'high';
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className={`p-4 rounded-2xl shadow-2xl border flex flex-col gap-2 pointer-events-auto backdrop-blur-md transition-all ${
                  isHigh 
                    ? 'bg-rose-950/90 text-rose-100 border-rose-500/50 ring-2 ring-rose-500/20' 
                    : 'bg-slate-900/90 text-slate-100 border-amber-500/50 ring-2 ring-amber-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${isHigh ? 'bg-rose-600/30 text-rose-400' : 'bg-amber-600/30 text-amber-400'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                        <span className="text-white">{alert.student_name}</span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                          isHigh ? 'bg-rose-600 text-white' : 'bg-amber-500 text-black'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {alert.roll_no || 'Candidate'} • {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRealtimeAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-semibold pl-8 text-slate-200">
                  <span className="underline decoration-rose-500/60 font-bold">{formatEventType(alert.event_type)}</span>
                  {alert.reason && <span className="text-slate-400 text-[11px] block mt-0.5">"{alert.reason}"</span>}
                </div>

                <div className="pl-8 pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedAttemptId(alert.attempt_id);
                      setRealtimeAlerts(prev => prev.filter(a => a.id !== alert.id));
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Focus Student Room
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveMonitoring;

