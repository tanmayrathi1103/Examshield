import React from 'react';
import { useApp } from '../context/AppContext';

const FacultyDirectory: React.FC = () => {
  const { faculties } = useApp();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Faculty Registry</h1>
        <p className="text-slate-500">View registered professors, course assignments, and officer audits.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4 md:p-6">ID</th>
              <th className="p-4 md:p-6">Faculty Member</th>
              <th className="p-4 md:p-6">Department</th>
              <th className="p-4 md:p-6">Assigned Courses</th>
              <th className="p-4 md:p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {faculties.map((fac) => (
              <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 md:p-6 font-mono text-indigo-600">{fac.id}</td>
                <td className="p-4 md:p-6">
                  <div>
                    <div className="font-extrabold text-slate-800">{fac.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{fac.email}</div>
                  </div>
                </td>
                <td className="p-4 md:p-6">{fac.department}</td>
                <td className="p-4 md:p-6">
                  <div className="flex gap-1.5 flex-wrap">
                    {fac.courses.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded text-[9px] font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 md:p-6 text-right">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block bg-emerald-50 text-emerald-700 border-emerald-100">
                    Certified Proctor
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacultyDirectory;
