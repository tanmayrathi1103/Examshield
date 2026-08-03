import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle, Info, Settings, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { useExams } from '../hooks/useExams';
import type { ExamCreate } from '../types';
import { Card, Button } from '../components/ui';

const CreateExam: React.FC = () => {
  const { createExam, isLoading, error } = useExams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60);
  const [totalMarks, setTotalMarks] = useState<number | ''>(100);
  const [passingMarks, setPassingMarks] = useState<number | ''>(40);
  const [instructions, setInstructions] = useState('');

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(curr => curr + 1);
      return;
    }

    const newExam: ExamCreate = {
      title,
      exam_code: examCode,
      description: description || undefined,
      subject: subject || undefined,
      duration_minutes: Number(durationMinutes),
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
      total_marks: Number(totalMarks),
      passing_marks: Number(passingMarks),
      instructions: instructions || undefined,
    };

    try {
      const created = await createExam(newExam);
      navigate(`/faculty/manage-exam/${created.id}`);
    } catch (err) {
      console.error('Failed to create exam', err);
    }
  };

  const steps = [
    { id: 1, title: 'Basic Info', icon: Info },
    { id: 2, title: 'Settings', icon: Settings },
    { id: 3, title: 'Schedule', icon: CalendarIcon },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/faculty/dashboard')}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Create Assessment</h1>
          <p className="text-slate-500">Configure parameters for a new examination.</p>
        </div>
      </div>

      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map(step => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30' :
                isCompleted ? 'bg-indigo-600 text-white border-indigo-600' :
                'bg-white text-slate-400 border-slate-200'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl border border-rose-100 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Final Examination 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. CS450"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 uppercase"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Brief description of this assessment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Settings */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Minutes) *</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={1}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Marks *</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Marks *</label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instructions to Candidates</label>
                <textarea
                  placeholder="e.g. Do not navigate away from the test window..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>Scheduling is optional. If you leave these blank, you must manually start and stop the exam when the time comes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setCurrentStep(curr => curr - 1)}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            <Button 
              type="submit" 
              isLoading={isLoading} 
              rightIcon={currentStep < 3 ? <ArrowRight className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {currentStep < 3 ? 'Continue' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateExam;
