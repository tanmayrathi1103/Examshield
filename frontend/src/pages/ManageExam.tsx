import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Eye, Send, Users, Trash2, Clock, BookOpen,
  CheckCircle, AlertCircle, Edit3, Copy, X, Check, FileText, Award, Calendar,
  Settings, PenTool, LayoutTemplate
} from 'lucide-react';
import { useExams } from '../hooks/useExams';
import { useQuestions } from '../hooks/useQuestions';
import { examsApi } from '../api/exams';
import type { ExamResponse, QuestionResponse, ExamUpdate } from '../types';
import QuestionEditor from '../components/QuestionEditor';
import AssignStudents from '../components/AssignStudents';
import { Card, Button, Badge, ConfirmDialog, EmptyState, Skeleton } from '../components/ui';

// ─── Toast ───────────────────────────────────────────────────────────────────
interface ToastProps { message: string; type: 'success' | 'error' | 'info'; onClose: () => void; }
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  };
  const icons = { success: <Check className="w-4 h-4" />, error: <AlertCircle className="w-4 h-4" />, info: <AlertCircle className="w-4 h-4" /> };
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-4 py-3 border rounded-2xl shadow-xl text-sm font-semibold max-w-sm ${colors[type]} animate-in slide-in-from-top-4`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ManageExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { fetchExamById, updateExam, publishExam, deleteExam, isLoading: examLoading } = useExams();
  const { questions, fetchQuestionsForExam, deleteQuestion, duplicateQuestion, isLoading: qLoading } = useQuestions();

  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [showAssignStudents, setShowAssignStudents] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'exam' | 'question'; id: string, name?: string } | null>(null);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'questions' | 'students' | 'settings' | 'preview'>('questions');
  
  // Settings Tab State
  const [settingsForm, setSettingsForm] = useState<Partial<ExamUpdate>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const loadExam = useCallback(async () => {
    if (!examId) return;
    try {
      const data = await fetchExamById(examId);
      setExam(data);
      // Initialize settings form
      const formatForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };
      setSettingsForm({
        title: data.title,
        description: data.description || '',
        subject: data.subject || '',
        duration_minutes: data.duration_minutes,
        start_time: formatForInput(data.start_time),
        end_time: formatForInput(data.end_time),
        total_marks: data.total_marks,
        passing_marks: data.passing_marks,
        instructions: data.instructions || ''
      });
    } catch {
      showToast('Failed to load exam', 'error');
    }
  }, [examId, fetchExamById]);

  const loadQuestions = useCallback(async () => {
    if (!examId) return;
    try {
      await fetchQuestionsForExam(examId);
    } catch {
      // silently handled
    }
  }, [examId, fetchQuestionsForExam]);

  const loadAssignedCount = useCallback(async () => {
    if (!examId) return;
    try {
      const data = await examsApi.getAssignments(examId, 0, 1);
      setAssignedCount(data.total);
    } catch {
      setAssignedCount(0);
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
    loadQuestions();
    loadAssignedCount();
  }, [loadExam, loadQuestions, loadAssignedCount]);

  const handlePublish = async () => {
    if (!exam) return;
    setIsPublishing(true);
    setPublishErrors([]);
    try {
      const updated = await publishExam(exam.id);
      setExam(updated);
      showToast('Exam published successfully!', 'success');
    } catch (err: any) {
      if (err?.errors) {
        setPublishErrors(err.errors);
      } else {
        const detail = err?.response?.data?.detail;
        if (detail?.errors) setPublishErrors(detail.errors);
        else showToast(typeof detail === 'string' ? detail : 'Failed to publish exam', 'error');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion(id);
      showToast('Question deleted', 'success');
      setConfirmDelete(null);
    } catch {
      showToast('Failed to delete question', 'error');
    }
  };

  const handleDuplicateQuestion = async (id: string) => {
    try {
      await duplicateQuestion(id);
      showToast('Question duplicated', 'success');
    } catch {
      showToast('Failed to duplicate question', 'error');
    }
  };

  const handleDeleteExam = async () => {
    if (!exam) return;
    setIsDeleting(true);
    try {
      await deleteExam(exam.id);
      navigate('/faculty/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : 'Failed to delete exam', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;
    setIsSavingSettings(true);
    
    try {
      const updateData: ExamUpdate = {
        title: settingsForm.title,
        description: settingsForm.description || undefined,
        subject: settingsForm.subject || undefined,
        duration_minutes: Number(settingsForm.duration_minutes),
        start_time: settingsForm.start_time ? new Date(settingsForm.start_time as string).toISOString() : undefined,
        end_time: settingsForm.end_time ? new Date(settingsForm.end_time as string).toISOString() : undefined,
        total_marks: Number(settingsForm.total_marks),
        passing_marks: Number(settingsForm.passing_marks),
        instructions: settingsForm.instructions || undefined,
      };

      const updated = await updateExam(exam.id, updateData);
      setExam(updated);
      showToast('Settings saved successfully', 'success');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleQuestionSaved = () => {
    setShowQuestionEditor(false);
    setEditingQuestion(null);
    loadQuestions();
    showToast('Question saved successfully!', 'success');
  };

  if (examLoading && !exam) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-full h-32 rounded-3xl" />
        <div className="flex gap-4">
          <Skeleton className="w-1/4 h-64 rounded-3xl" />
          <Skeleton className="w-3/4 h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <EmptyState 
        icon={AlertCircle}
        title="Exam Not Found"
        description="This examination may have been deleted or you don't have access to it."
        action={<Button onClick={() => navigate('/faculty/dashboard')}>Back to Dashboard</Button>}
      />
    );
  }

  const totalQuestionMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const isPublished = exam.status === 'active' || exam.status === 'scheduled';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.type === 'exam' ? 'Delete Assessment' : 'Delete Question'}
        message={confirmDelete?.type === 'exam'
          ? <div>This action cannot be undone. All <strong>Questions</strong>, <strong>Student Assignments</strong>, and <strong>Exam Attempts</strong> will be permanently deleted.</div>
          : 'Are you sure you want to delete this question? It will be removed immediately.'}
        requireTypedConfirmation={confirmDelete?.type === 'exam' ? confirmDelete.name : undefined}
        onConfirm={() => {
          if (confirmDelete?.type === 'exam') handleDeleteExam();
          else if (confirmDelete?.id) handleDeleteQuestion(confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeleting}
      />

      {showAssignStudents && exam && (
        <AssignStudents
          examId={exam.id}
          onClose={() => setShowAssignStudents(false)}
          onChanged={() => {
            loadAssignedCount();
            showToast('Student assignments updated', 'success');
          }}
        />
      )}

      {showQuestionEditor && exam && (
        <QuestionEditor
          examId={exam.id}
          question={editingQuestion}
          onSaved={handleQuestionSaved}
          onCancel={() => { setShowQuestionEditor(false); setEditingQuestion(null); }}
        />
      )}

      {/* Control Center Header */}
      <Card className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex gap-4 items-start relative z-10">
          <button
            onClick={() => navigate('/faculty/dashboard')}
            className="mt-1 p-2 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{exam.title}</h1>
              <Badge variant={exam.status}>{exam.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {exam.exam_code}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {exam.subject || 'No Subject'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto">
          {!isPublished ? (
            <Button 
              onClick={handlePublish} 
              isLoading={isPublishing} 
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full md:w-auto shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700"
            >
              Publish Assessment
            </Button>
          ) : (
             <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm justify-center">
               <CheckCircle className="w-4 h-4" />
               {exam.status === 'active' ? 'Published & Active' : 'Scheduled'}
             </div>
          )}
          <Button 
            variant="danger" 
            onClick={() => setConfirmDelete({ type: 'exam', id: exam.id, name: exam.title })}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Assessment
          </Button>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/60 p-2">
        {[
          { id: 'questions', label: 'Questions', icon: LayoutTemplate, count: questions.length },
          { id: 'students', label: 'Students', icon: Users, count: assignedCount },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'preview', label: 'Preview Paper', icon: Eye }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 ${activeTab === tab.id ? 'bg-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content: Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex gap-6">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Total Questions</div>
                <div className="text-xl font-black text-slate-800">{questions.length}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Total Marks</div>
                <div className="text-xl font-black text-slate-800">{totalQuestionMarks}</div>
              </div>
            </div>
            <Button onClick={() => { setEditingQuestion(null); setShowQuestionEditor(true); }} leftIcon={<Plus className="w-4 h-4" />}>
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <EmptyState 
              icon={LayoutTemplate}
              title="No questions yet"
              description="Start building your question bank for this assessment."
              action={<Button onClick={() => { setEditingQuestion(null); setShowQuestionEditor(true); }}>Add First Question</Button>}
            />
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id} className="p-5 flex gap-4 hover:border-indigo-100 transition-colors group">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="font-bold text-slate-800 text-sm">{q.question_text}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingQuestion(q); setShowQuestionEditor(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><PenTool className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicateQuestion(q.id)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete({ type: 'question', id: q.id })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="info" size="sm">{q.question_type.replace('_', '/')}</Badge>
                      <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'error' : 'warning'} size="sm">{q.difficulty}</Badge>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      {q.negative_marks > 0 && <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg">-{q.negative_marks} neg</span>}
                    </div>

                    {q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className={`text-xs px-3 py-2 rounded-xl border font-medium flex items-center gap-2 ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            <span className="opacity-50">{String.fromCharCode(65 + oi)}.</span>
                            <span className="flex-1">{opt.option_text}</span>
                            {opt.is_correct && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Students */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Assigned Students</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              You have {assignedCount} student{assignedCount !== 1 ? 's' : ''} assigned to this examination. Students must be assigned before they can access the exam.
            </p>
            <Button onClick={() => setShowAssignStudents(true)} leftIcon={<Users className="w-4 h-4" />}>
              Manage Assignments
            </Button>
          </Card>
        </div>
      )}

      {/* Tab Content: Settings */}
      {activeTab === 'settings' && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Title *</label>
                <input
                  type="text"
                  value={settingsForm.title || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  required
                  disabled={isPublished}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={settingsForm.subject || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    disabled={isPublished}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Minutes) *</label>
                  <input
                    type="number"
                    value={settingsForm.duration_minutes || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={1}
                    disabled={isPublished}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.start_time as string || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, start_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.end_time as string || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, end_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Marks *</label>
                  <input
                    type="number"
                    value={settingsForm.total_marks || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, total_marks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={1}
                    disabled={isPublished}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Marks *</label>
                  <input
                    type="number"
                    value={settingsForm.passing_marks || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, passing_marks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={0}
                    disabled={isPublished}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instructions</label>
                <textarea
                  value={settingsForm.instructions || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  disabled={isPublished}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={isSavingSettings} disabled={isPublished}>
                  Save Settings
                </Button>
              </div>
              {isPublished && (
                <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                  Some settings cannot be changed because this exam is published.
                </p>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* Tab Content: Preview */}
      {activeTab === 'preview' && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="text-center mb-8 border-b pb-6">
              <h2 className="text-2xl font-extrabold text-slate-800">{exam.title}</h2>
              <div className="text-sm font-bold text-slate-500 mt-2 flex justify-center gap-4">
                <span>{exam.exam_code}</span>
                <span>{exam.subject}</span>
                <span>{exam.duration_minutes} mins</span>
                <span>{exam.total_marks} marks</span>
              </div>
            </div>
            
            {exam.instructions && (
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 mb-8">
                <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider mb-2">Instructions to Candidates</h4>
                <div className="text-sm text-amber-900 whitespace-pre-wrap font-medium">{exam.instructions}</div>
              </div>
            )}

            {questions.length === 0 ? (
               <div className="text-center text-slate-400 italic py-8">No questions to preview.</div>
            ) : (
              <div className="space-y-8">
                {questions.map((q, idx) => (
                  <div key={q.id} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="font-bold text-slate-800">{idx + 1}.</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-sm">{q.question_text}</div>
                        <div className="mt-1 text-xs text-slate-500 font-bold">[{q.marks} Marks]</div>
                      </div>
                    </div>
                    {q.options.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className="flex gap-3 text-sm font-medium text-slate-700">
                            <input type={q.question_type === 'mcq' ? 'radio' : 'checkbox'} disabled className="mt-1" />
                            <span>{String.fromCharCode(65 + oi)}. {opt.option_text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageExam;
