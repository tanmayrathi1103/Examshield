import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import type { QuestionResponse, QuestionCreate, QuestionUpdate, QuestionType, Difficulty, QuestionOptionCreate } from '../types';
import { Button, Card, Badge } from './ui';

interface QuestionEditorProps {
  examId: string;
  question?: QuestionResponse | null;
  onSaved: () => void;
  onCancel: () => void;
}

const defaultOptions = (): QuestionOptionCreate[] => [
  { option_text: '', is_correct: false, display_order: 1 },
  { option_text: '', is_correct: false, display_order: 2 },
  { option_text: '', is_correct: false, display_order: 3 },
  { option_text: '', is_correct: false, display_order: 4 },
];

const QuestionEditor: React.FC<QuestionEditorProps> = ({ examId, question, onSaved, onCancel }) => {
  const { createQuestion, updateQuestion, isLoading, error } = useQuestions();
  const isEditing = !!question;

  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<QuestionOptionCreate[]>(defaultOptions());
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(true); // for true_false
  const [localError, setLocalError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text);
      setQuestionType(question.question_type);
      setMarks(question.marks);
      setNegativeMarks(question.negative_marks);
      setDifficulty(question.difficulty);
      setExplanation(question.explanation || '');
      if (question.options.length > 0) {
        const opts = question.options.map(o => ({
          option_label: o.option_label,
          option_text: o.option_text,
          is_correct: o.is_correct,
          display_order: o.display_order,
        }));
        setOptions(opts);
        if (question.question_type === 'true_false') {
          const trueOpt = question.options.find(o => o.option_text === 'True');
          setCorrectAnswer(trueOpt?.is_correct ?? true);
        }
      } else {
        setOptions(defaultOptions());
      }
    }
  }, [question]);

  // Reset options when type changes
  useEffect(() => {
    if (!question) {
      setOptions(defaultOptions());
      setCorrectAnswer(true);
    }
  }, [questionType, question]);

  const addOption = () => {
    setOptions(prev => [...prev, { option_text: '', is_correct: false, display_order: prev.length + 1 }]);
  };

  const removeOption = (idx: number) => {
    setOptions(prev => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, display_order: i + 1 })));
  };

  const updateOption = (idx: number, field: keyof QuestionOptionCreate, value: string | boolean | number) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== idx) return o;
      if (field === 'is_correct' && value === true) {
        return { ...o, is_correct: true };
      }
      return { ...o, [field]: value };
    }));
  };

  const setCorrectOption = (idx: number) => {
    setOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })));
  };

  const validate = (): boolean => {
    setLocalError(null);
    if (!questionText.trim()) { setLocalError('Question text is required'); return false; }
    if (marks < 1) { setLocalError('Marks must be at least 1'); return false; }
    if (questionType === 'mcq') {
      const filled = options.filter(o => o.option_text.trim());
      if (filled.length < 2) { setLocalError('MCQ must have at least 2 options'); return false; }
      const correct = options.filter(o => o.is_correct);
      if (correct.length !== 1) { setLocalError('MCQ must have exactly one correct option'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing && question) {
        const updateData: QuestionUpdate = {
          question_text: questionText,
          marks,
          negative_marks: negativeMarks,
          difficulty,
          explanation: explanation || undefined,
        };
        if (questionType === 'mcq') {
          updateData.options = options.filter(o => o.option_text.trim()).map((o, i) => ({ ...o, display_order: i + 1 }));
        } else if (questionType === 'true_false') {
          updateData.correct_answer = correctAnswer;
        }
        await updateQuestion(question.id, updateData);
      } else {
        const createData: QuestionCreate = {
          exam_id: examId,
          question_type: questionType,
          question_text: questionText,
          marks,
          negative_marks: negativeMarks,
          difficulty,
          explanation: explanation || undefined,
        };
        if (questionType === 'mcq') {
          createData.options = options.filter(o => o.option_text.trim()).map((o, i) => ({ ...o, display_order: i + 1 }));
        } else if (questionType === 'true_false') {
          createData.correct_answer = correctAnswer;
        }
        await createQuestion(createData);
      }
      onSaved();
    } catch (err: any) {
      // Error handled by hook
    }
  };

  const typeLabels: Record<QuestionType, string> = {
    mcq: 'Multiple Choice (MCQ)',
    true_false: 'True / False',
    descriptive: 'Short Answer',
    numerical: 'Long Answer',
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
      <div className="bg-slate-50 rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col my-auto relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-[2rem]">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {isEditing ? 'Edit Question' : 'Create Question'}
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Configure question details and correct answers.</p>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left Column: Form */}
          <div className="flex-1 p-6 md:p-8 border-r border-slate-200/60 overflow-y-auto max-h-[70vh]">
            <form id="question-form" onSubmit={handleSubmit} className="space-y-8">
              {displayError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-rose-700">{displayError}</p>
                </div>
              )}

              {/* Question Type */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.entries(typeLabels) as [QuestionType, string][]).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => !isEditing && setQuestionType(type)} // Type cannot be changed when editing in backend usually, but allowing for UI consistency. Actually, backend doesn't allow changing question_type.
                      disabled={isEditing}
                      className={`p-3 text-xs font-bold rounded-xl border transition-all text-center ${
                        questionType === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                      } ${isEditing && questionType !== type ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Text *</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question here..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                  required
                />
              </div>

              {/* MCQ Options */}
              {questionType === 'mcq' && (
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options (select the correct one)</label>
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(idx)}
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all font-bold text-xs ${
                            opt.is_correct
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : 'border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-500'
                          }`}
                          title="Set as correct answer"
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input
                          type="text"
                          value={opt.option_text}
                          onChange={(e) => updateOption(idx, 'option_text', e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                            opt.is_correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''
                          }`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* True / False */}
              {questionType === 'true_false' && (
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correct Answer</label>
                  <div className="flex gap-4">
                    {[true, false].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setCorrectAnswer(val)}
                        className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all ${
                          correctAnswer === val
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {val ? 'True' : 'False'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Marks & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marks *</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Neg. Marks</label>
                  <input
                    type="number"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                    min={0}
                    step={0.25}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explanation (optional)</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain the correct answer (shown after exam submission)..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                />
              </div>
            </form>
          </div>

          {/* Right Column: Preview */}
          <div className="w-full md:w-[350px] lg:w-[400px] bg-slate-50 p-6 md:p-8 flex flex-col h-full rounded-br-[2rem]">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Real-time Preview
            </h3>
            
            <Card className="p-5 flex-1 relative overflow-hidden bg-white shadow-sm border-slate-200">
              {/* Fake UI Header */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <Badge variant={difficulty === 'easy' ? 'success' : difficulty === 'hard' ? 'error' : 'warning'} size="sm">
                  {difficulty}
                </Badge>
                <div className="text-xs font-bold text-slate-400 flex gap-2">
                  <span>+{marks}</span>
                  {negativeMarks > 0 && <span className="text-rose-400">-{negativeMarks}</span>}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                {questionText || <span className="text-slate-300 italic">Question text will appear here...</span>}
              </div>

              {/* Options */}
              <div className="mt-6 space-y-3">
                {questionType === 'mcq' && options.map((opt, i) => opt.option_text.trim() && (
                  <div key={i} className="flex gap-3 text-sm font-medium text-slate-600 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      {opt.is_correct && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <span>{opt.option_text}</span>
                  </div>
                ))}
                {questionType === 'true_false' && [true, false].map((val) => (
                  <div key={String(val)} className="flex gap-3 text-sm font-medium text-slate-600 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      {correctAnswer === val && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <span>{val ? 'True' : 'False'}</span>
                  </div>
                ))}
                {(questionType === 'descriptive' || questionType === 'numerical') && (
                  <div className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Student Input Area
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-[2rem]">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="question-form"
            isLoading={isLoading} 
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Save Changes' : 'Add Question'}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default QuestionEditor;
