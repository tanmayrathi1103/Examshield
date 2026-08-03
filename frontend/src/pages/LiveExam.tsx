import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ShieldAlert, Video, Mic, Wifi, Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, 
  HelpCircle, Eye, Shield, Smartphone, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamAttempt } from '../hooks/useExamAttempt';
import { useExamTimer } from '../hooks/useExamTimer';
import { useAutoSave } from '../hooks/useAutoSave';
import { useQuestionNavigation } from '../hooks/useQuestionNavigation';
import { examsApi } from '../api/exams';
import { questionsApi } from '../api/questions';
import type { ExamResponse, QuestionResponse } from '../types';

const LiveExam: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();

  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [isExamFullscreen, setIsExamFullscreen] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<any[]>([]);

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
        setError(typeof detail === 'string' ? detail : err.message || "Failed to initialize exam");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [examId, navigate]); // Intentionally omitting startOrResume from deps to run once

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
      navigate(`/student/exam-result?attemptId=${attempt?.id}`);
    }
  };

  const { formattedTime, timeRemaining } = useExamTimer(attempt?.expires_at, handleExpire);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !exam || !attempt) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold">Error Loading Exam</h2>
          <p className="text-slate-400">{error || "Attempt could not be initialized"}</p>
          <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 bg-indigo-600 rounded-lg">Return to Dashboard</button>
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
    navigate(`/student/exam-result?attemptId=${attempt.id}`);
  };

  const handleExitFullscreen = () => {
    setIsExamFullscreen(false);
  };

  const handleEnterFullscreen = () => {
    setIsExamFullscreen(true);
  };

  const activeQuestion = questions[activeIndex];
  const examViolationsCount = violations.length;
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
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{exam.course_code || 'EXAM'}</div>
          <h2 className="text-lg font-bold tracking-tight text-white">{exam.title}</h2>
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
            <span className={`font-extrabold text-sm font-mono ${timeRemaining && timeRemaining < 300 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {formattedTime}
            </span>
          </div>
        </div>
      </header>

      {/* Main proctoring layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
        
        {/* Left Side: Proctoring Feed Panel */}
        <div className="space-y-6 hidden lg:block">
          {/* Simulated webcam */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden relative shadow-lg">
            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-36 h-36 border-2 border-dashed border-emerald-500 rounded-full flex items-center justify-center relative animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500" />
                  <div className="absolute -top-1 px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[8px] font-bold rounded uppercase">
                    Face Locked: 98%
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
                <div><div className="text-[10px] text-slate-400 uppercase">Face Count</div><div className="text-slate-200">1 Detected</div></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 flex justify-between items-center">
              <span>Proctoring Alert log</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-400">0 Warnings</span>
            </h3>
            <div className="text-xs text-slate-400 italic">No behavioral incidents flagged. Academic integrity secure.</div>
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
    </div>
  );
};

export default LiveExam;
