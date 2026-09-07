import React, { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, AlertCircle, Award } from 'lucide-react';
import { adminApi } from '../api/admin';
import type { FacultyDirectoryItem } from '../types';

const FacultyDirectory: React.FC = () => {
  const [faculties, setFaculties] = useState<FacultyDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getFacultyDirectory();
      setFaculties(data);
    } catch (err: any) {
      console.error('Failed to load faculty directory:', err);
      setError(err.response?.data?.detail || 'Failed to load faculty directory from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const departments = ['All', ...Array.from(new Set(faculties.map(f => f.department).filter(Boolean)))];

  const filteredFaculties = faculties.filter(faculty => {
    const matchesSearch = 
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || faculty.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Faculty Registry</h1>
          <p className="text-slate-500 mt-1 text-sm">Certified exam proctors, departmental appointments, and active course assignments.</p>
        </div>

        <button
          onClick={fetchFaculty}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by faculty name, designation, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Faculty Registry...</p>
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No faculty members found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 md:p-6">Employee ID</th>
                  <th className="p-4 md:p-6">Faculty Member</th>
                  <th className="p-4 md:p-6">Department</th>
                  <th className="p-4 md:p-6">Assigned Courses & Exams</th>
                  <th className="p-4 md:p-6 text-right">Proctor Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredFaculties.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 md:p-6 font-mono font-bold text-indigo-600">{fac.employee_id}</td>
                    <td className="p-4 md:p-6">
                      <div>
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {fac.name}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{fac.designation}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{fac.email}</div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
                        {fac.department}
                      </span>
                    </td>
                    <td className="p-4 md:p-6">
                      <div className="flex gap-1.5 flex-wrap max-w-md">
                        {fac.assigned_courses.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${
                        fac.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        <Award className="w-3 h-3" />
                        {fac.status === 'active' ? 'Certified Proctor' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDirectory;
