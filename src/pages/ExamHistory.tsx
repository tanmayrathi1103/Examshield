import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const ExamHistory: React.FC = () => {
  const { exams, students } = useApp();
  const navigate = useNavigate();

  const currentStudent = students.find(s => s.name === 'Tanmay Rathi') || {
    integrityScore: 89
  };

  const completedExams = exams.filter(e => e.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Your Exam History</h1>
        <p className="text-slate-500">View and audit all historical proctored assessments.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Completed Assessments</h2>
        </div>

        {completedExams.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">No completed exams found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedExams.map((exam) => (
              <div key={exam.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-600">{exam.code} • {exam.subject}</div>
                  <h3 className="text-base font-extrabold text-slate-800">{exam.title}</h3>
                  <div className="flex gap-4 text-xs text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(exam.dateTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration} Mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Score Indicator */}
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Result</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-0.5">85% Passed</div>
                  </div>

                  {/* Trust Rating */}
                  <div className="text-right pl-4 border-l">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Integrity</div>
                    <div className={`text-sm font-extrabold mt-0.5 ${
                      currentStudent.integrityScore >= 90 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {currentStudent.integrityScore}%
                    </div>
                  </div>

                  {/* Action */}
                  <button 
                    onClick={() => navigate(`/student/report?examId=${exam.id}`)}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-indigo-100"
                  >
                    <FileText className="w-4 h-4" /> Compliance Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamHistory;
