import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, AlertTriangle } from 'lucide-react';

const StudentReports: React.FC = () => {
  const { students, violations, exams } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Student Reports Directory</h1>
        <p className="text-slate-500">Access historical AI integrity compliance sheets and session metrics.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-6 bg-slate-50 border-b">
          <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Academic Integrity Logs</h2>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center italic text-slate-400">No student records found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student) => {
              const studentViolations = violations.filter(v => v.studentName === student.name);
              return (
                <div key={student.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-sm">{student.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{student.rollNo} • {student.department}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Integrity Score</span>
                      <span className={`text-sm font-bold ${student.integrityScore >= 90 ? 'text-emerald-500' : student.integrityScore >= 75 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                        {student.integrityScore}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Compliance Risk</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-block ${student.integrityScore >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : student.integrityScore >= 75
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        {student.integrityScore >= 90 ? 'Low' : student.integrityScore >= 75 ? 'Medium' : 'High'}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/student/report?examId=3`)} // Mock dbms exam
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-100"
                    >
                      <FileText className="w-4 h-4" /> View Compliance Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReports;
