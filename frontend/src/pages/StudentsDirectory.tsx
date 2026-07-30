import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ShieldAlert, Award } from 'lucide-react';

const StudentsDirectory: React.FC = () => {
  const { students, setStudents, addAuditLog } = useApp();

  const handleToggleStatus = (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setStudents(prev => prev.map(s => {
      if (s.id === id) return { ...s, status: nextStatus };
      return s;
    }));
    addAuditLog(`Set status of Student: ${name} to ${nextStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Students Registry</h1>
        <p className="text-slate-500">Provision students, manage statuses, and review integrity trust ratios.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4 md:p-6">Roll No</th>
              <th className="p-4 md:p-6">Student Name</th>
              <th className="p-4 md:p-6">Department</th>
              <th className="p-4 md:p-6 text-center">Integrity Rating</th>
              <th className="p-4 md:p-6 text-center">Proctoring Status</th>
              <th className="p-4 md:p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 md:p-6 font-mono text-indigo-600">{student.rollNo}</td>
                <td className="p-4 md:p-6">
                  <div>
                    <div className="font-extrabold text-slate-800">{student.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{student.email}</div>
                  </div>
                </td>
                <td className="p-4 md:p-6">{student.department}</td>
                <td className="p-4 md:p-6 text-center">
                  <span className={`font-extrabold text-sm ${student.integrityScore >= 90 ? 'text-emerald-500' : student.integrityScore >= 75 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                    {student.integrityScore}%
                  </span>
                </td>
                <td className="p-4 md:p-6 text-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block ${student.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : student.status === 'suspended'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {student.status}
                  </span>
                </td>
                <td className="p-4 md:p-6 text-right">
                  <button
                    onClick={() => handleToggleStatus(student.id, student.name, student.status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${student.status === 'suspended'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                  >
                    {student.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsDirectory;
