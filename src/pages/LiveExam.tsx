import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldAlert, Video, Mic, Wifi, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, 
  HelpCircle, Eye, Shield, Smartphone, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveExam: React.FC = () => {
  const { 
    exams, questions, activeExamId, setActiveExamId, 
    studentAnswers, setStudentAnswers, violations, addViolation, 
    resetExamState, isExamFullscreen, setIsExamFullscreen
  } = useApp();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');

  const exam = exams.find(e => e.id === examId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Set active exam ID on load
  useEffect(() => {
    if (examId) {
      setActiveExamId(examId);
      setTimeLeft((exam?.duration || 60) * 60);
      
      // Automatically request fullscreen (simulated)
      setIsExamFullscreen(true);
    } else {
      navigate('/student/dashboard');
    }
    return () => {
      // Don't reset context immediately so reports can read details
    };
  }, [examId, exam, setActiveExamId, navigate, setIsExamFullscreen]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulated autosave whenever answer changes
  const handleSelectOption = (qId: string, optIdx: number) => {
    setStudentAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
    setAutoSaving(true);
    setTimeout(() => setAutoSaving(false), 800);
  };

  // Exit fullscreen violation simulation
  const handleExitFullscreen = () => {
    setIsExamFullscreen(false);
    addViolation('Tab Switched', 'high');
  };

  const handleEnterFullscreen = () => {
    setIsExamFullscreen(true);
  };

  const handleSubmitExam = () => {
    setShowSubmitModal(false);
    navigate(`/student/exam-result?examId=${examId}`);
  };

  // Get current active question
  const activeQuestion = questions[currentIdx] || questions[0];

  // Proctoring warnings count
  const examViolationsCount = violations.filter(v => v.examTitle === exam?.title).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col -m-6 md:-m-8 p-6 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Header bar */}
      <header className="flex justify-between items-center py-4 px-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl mb-6 backdrop-blur-md">
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{exam?.code}</div>
          <h2 className="text-lg font-bold tracking-tight text-white">{exam?.title}</h2>
        </div>
        
        <div className="flex items-center gap-6">
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

          {/* Autosave Status */}
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${autoSaving ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'}`} />
            {autoSaving ? 'Saving response...' : 'All changes saved'}
          </span>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold text-sm font-mono text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main proctoring layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
        
        {/* Left Side: Proctoring Feed Panel */}
        <div className="space-y-6">
          {/* Simulated webcam */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden relative shadow-lg">
            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative">
              
              {/* Camera output simulation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Face tracking bounds (Simulated HUD overlay) */}
                <div className="w-36 h-36 border-2 border-dashed border-emerald-500 rounded-full flex items-center justify-center relative animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500" />
                  <div className="absolute -top-1 px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[8px] font-bold rounded uppercase">
                    Face Locked: 98%
                  </div>
                </div>
              </div>

              {/* Status details on camera view */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-slate-300">
                PROCTOR FEED • LIVE
              </div>
            </div>

            {/* AI compliance sensors grid */}
            <div className="p-4 bg-slate-850/50 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Eye className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Eye Contact</div>
                  <div className="text-slate-200">Maintained</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Video className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Face Count</div>
                  <div className="text-slate-200">1 Detected</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Devices</div>
                  <div className="text-slate-200">Clear</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                <Mic className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Audio Spikes</div>
                  <div className="text-slate-200">None</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Proctoring Log */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 flex justify-between items-center">
              <span>Proctoring Alert log</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${examViolationsCount > 2 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {examViolationsCount} Warnings
              </span>
            </h3>
            
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {violations.filter(v => v.examTitle === exam?.title).length === 0 ? (
                <div className="text-xs text-slate-400 italic">No behavioral incidents flagged. Academic integrity secure.</div>
              ) : (
                violations.filter(v => v.examTitle === exam?.title).map((violation) => (
                  <div key={violation.id} className="p-2.5 bg-slate-900/40 rounded-xl border border-rose-500/20 text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-200">{violation.type}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Severity: {violation.severity} • {new Date(violation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Active Question box */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 flex-grow flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                <span className="text-xs bg-slate-700 border border-slate-650 px-2 py-1 rounded font-bold">{activeQuestion?.points} Points</span>
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-bold leading-relaxed text-white">
                {activeQuestion?.text}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-3">
                {activeQuestion?.options.map((option, index) => {
                  const isSelected = studentAnswers[activeQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(activeQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between font-semibold ${
                        isSelected 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-900/20 border-slate-700 hover:border-slate-500 hover:bg-slate-800/25 text-slate-300'
                      }`}
                    >
                      <span>{option}</span>
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
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
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button 
                onClick={() => {
                  setStudentAnswers(prev => {
                    const next = { ...prev };
                    delete next[activeQuestion.id];
                    return next;
                  });
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Response
              </button>

              <button 
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
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

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = studentAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-10 rounded-lg text-xs font-bold transition-all border ${
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

              {/* Palette Legend */}
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

            {/* Submit Block */}
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
                  Ensure all questions are reviewed. You answered {Object.keys(studentAnswers).length} out of {questions.length} questions.
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
    </div>
  );
};

export default LiveExam;
