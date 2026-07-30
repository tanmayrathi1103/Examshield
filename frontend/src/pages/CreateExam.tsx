import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, PlusCircle } from 'lucide-react';
import { useExams } from '../hooks/useExams';
import type { ExamCreate } from '../types';

const CreateExam: React.FC = () => {
  const { createExam, isLoading, error } = useExams();
  const navigate = useNavigate();

  // Form states matching backend schema
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newExam: ExamCreate = {
      title,
      exam_code: examCode,
      duration_minutes: durationMinutes,
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      subject,
      total_marks: totalMarks,
      passing_marks: passingMarks,
    };

    try {
      await createExam(newExam);
      navigate('/faculty/dashboard');
    } catch (err) {
      console.error('Failed to create exam', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Schedule New Examination</h1>
        <p className="text-slate-500">Configure parameters for AI proctoring and assessment limits.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3">Examination Parameters</h3>
        
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Title</label>
            <input 
              type="text" 
              placeholder="e.g. Distributed Databases Final" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Code</label>
            <input 
              type="text" 
              placeholder="e.g. CS450" 
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Minutes)</label>
            <input 
              type="number" 
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
              min={1}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
            <input 
              type="datetime-local" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-600" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Marks</label>
            <input 
              type="number" 
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
              min={1}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Marks</label>
            <input 
              type="number" 
              value={passingMarks}
              onChange={(e) => setPassingMarks(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
              min={0}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t">
          <button 
            type="button" 
            onClick={() => navigate('/faculty/dashboard')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700 hover:-translate-y-0.5'}`}
          >
            <PlusCircle className="w-4 h-4" /> {isLoading ? 'Scheduling...' : 'Schedule Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
