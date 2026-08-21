import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useExams } from '../hooks/useExams';
import type { ExamResponse, ExamUpdate } from '../types';

interface EditExamModalProps {
  exam: ExamResponse;
  onClose: () => void;
  onSaved: (updatedExam: ExamResponse) => void;
}

const EditExamModal: React.FC<EditExamModalProps> = ({ exam, onClose, onSaved }) => {
  const { updateExam, isLoading, error } = useExams();

  const [title, setTitle] = useState(exam.title);
  const [description, setDescription] = useState(exam.description || '');
  const [subject, setSubject] = useState(exam.subject || '');
  const [durationMinutes, setDurationMinutes] = useState(exam.duration_minutes);
  
  // Handle timezone offsets for datetime-local
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Remove the Z and adjust to local string format required by datetime-local (YYYY-MM-DDThh:mm)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(formatForInput(exam.start_time));
  const [endTime, setEndTime] = useState(formatForInput(exam.end_time));
  const [totalMarks, setTotalMarks] = useState(exam.total_marks);
  const [passingMarks, setPassingMarks] = useState(exam.passing_marks);
  const [instructions, setInstructions] = useState(exam.instructions || '');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const updateData: ExamUpdate = {
      title,
      description: description || undefined,
      subject: subject || undefined,
      duration_minutes: durationMinutes,
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      instructions: instructions || undefined,
    };

    try {
      const updated = await updateExam(exam.id, updateData);
      onSaved(updated);
    } catch (err: any) {
      // error is handled by useExams hook but we can also catch
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setLocalError(detail);
      } else if (Array.isArray(detail)) {
        setLocalError(detail[0]?.msg || 'Validation Error');
      } else {
        setLocalError('Failed to update exam');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Edit Assessment Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Modify parameters before publishing</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(error || localError) && (
             <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100">
               {localError || error}
             </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Minutes) *</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                required
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date & Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Marks *</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                required
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Marks *</label>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                required
                min={0}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700 hover:-translate-y-0.5'}`}
            >
              <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExamModal;
