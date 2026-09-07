import React, { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { adminApi } from '../api/admin';
import type { StudentDirectoryItem } from '../types';

const StudentsDirectory: React.FC = () => {
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStudentsDirectory();
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to load students directory:', err);
      setError(err.response?.data?.detail || 'Failed to load students directory from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (id: string, name: string, currentStatus: string) => {
    const nextActive = currentStatus === 'suspended';
    try {
      setActionLoadingId(id);
      await adminApi.updateUserStatus(id, nextActive);
      setStudents(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, status: nextActive ? 'active' : 'suspended' };
        }
        return s;
      }));
      setFeedbackMessage(`Student ${name} successfully set to ${nextActive ? 'ACTIVE' : 'SUSPENDED'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update student status:', err);
      alert(err.response?.data?.detail || 'Could not update student status. Ensure you have administrator privileges.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const departments = ['All', ...Array.from(new Set(students.map(s => s.department).filter(Boolean)))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || student.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Students Registry</h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time student provisioning, integrity trust indices, and account enforcement.</p>
        </div>

        <button
          onClick={fetchStudents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

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
            placeholder="Search by name, roll number, or email..."
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Student Registry...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 md:p-6 font-mono font-bold text-indigo-600">{student.roll_no}</td>
                    <td className="p-4 md:p-6">
                      <div>
                        <div className="font-extrabold text-slate-800 text-sm">{student.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{student.email}</div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
                        {student.department}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <span className={`font-extrabold text-sm ${
                        student.integrity_score >= 90
                          ? 'text-emerald-500'
                          : student.integrity_score >= 75
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {student.integrity_score}%
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block ${
                        student.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(student.id, student.name, student.status)}
                        disabled={actionLoadingId === student.id}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-1.5 ml-auto ${
                          student.status === 'suspended'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {actionLoadingId === student.id && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {student.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
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

export default StudentsDirectory;
