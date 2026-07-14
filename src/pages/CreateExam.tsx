import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, PlusCircle } from 'lucide-react';

const CreateExam: React.FC = () => {
  const { setExams, addAuditLog } = useApp();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState(60);
  const [dateTime, setDateTime] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [department, setDepartment] = useState('CSE');
  const [questionsCount, setQuestionsCount] = useState(25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam = {
      id: `exam_${Date.now()}`,
      title,
      code,
      duration,
      dateTime,
      subject,
      department,
      questionsCount,
      status: 'upcoming' as const
    };

    setExams(prev => [newExam, ...prev]);
    addAuditLog(`Scheduled assessment: ${title} (${code})`);
    
    // Redirect
    navigate('/faculty/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Schedule New Examination</h1>
        <p className="text-slate-500">Configure parameters for AI proctoring and assessment limits.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3">Examination Parameters</h3>

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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Minutes)</label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
            <input 
              type="datetime-local" 
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-600" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions Allocation</label>
            <input 
              type="number" 
              value={questionsCount}
              onChange={(e) => setQuestionsCount(Number(e.target.value))}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Classification</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Department</label>
            <input 
              type="text" 
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
              required 
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
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" /> Schedule Assessment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
