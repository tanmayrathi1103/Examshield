import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Users, Check, UserPlus, UserMinus, AlertCircle, Loader } from 'lucide-react';
import { examsApi } from '../api/exams';
import type { StudentForAssignment } from '../types';

interface AssignStudentsProps {
  examId: string;
  onClose: () => void;
  onChanged: () => void;
}

const AssignStudents: React.FC<AssignStudentsProps> = ({ examId, onClose, onChanged }) => {
  const [students, setStudents] = useState<StudentForAssignment[]>([]);
  const [filtered, setFiltered] = useState<StudentForAssignment[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await examsApi.getExamStudents(examId);
      setStudents(data.items);
      setFiltered(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Filter students
  useEffect(() => {
    let result = students;
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        (s.enrollment_number || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    if (branchFilter) {
      result = result.filter(s => s.branch === branchFilter);
    }
    if (semesterFilter) {
      result = result.filter(s => String(s.semester) === semesterFilter);
    }
    setFiltered(result);
  }, [searchText, branchFilter, semesterFilter, students]);

  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))] as string[];
  const semesters = [...new Set(students.map(s => s.semester).filter(Boolean))].sort() as number[];

  const toggleStudent = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const unassigned = filtered.filter(s => !s.is_assigned).map(s => s.id);
    setSelected(prev => new Set([...prev, ...unassigned]));
  };

  const deselectAll = () => setSelected(new Set());

  const handleAssign = async () => {
    const toAssign = [...selected].filter(id => {
      const s = students.find(st => st.id === id);
      return s && !s.is_assigned;
    });
    if (toAssign.length === 0) { setError('No new students selected to assign'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await examsApi.assignStudents(examId, toAssign);
      setSuccessMsg(`${toAssign.length} student${toAssign.length !== 1 ? 's' : ''} assigned successfully`);
      setSelected(new Set());
      await loadStudents();
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await examsApi.removeStudent(examId, studentId);
      setSuccessMsg('Student removed from exam');
      await loadStudents();
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newlySelectedCount = [...selected].filter(id => {
    const s = students.find(st => st.id === id);
    return s && !s.is_assigned;
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Assign Students</h2>
              <p className="text-xs text-slate-500 mt-0.5">{students.filter(s => s.is_assigned).length} already assigned • {students.length} total students</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-rose-700">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">{successMsg}</p>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b bg-slate-50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, roll number, email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 text-xs font-semibold text-slate-700 focus:outline-none bg-transparent placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="">All Departments</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="px-4 py-2.5 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Select Unassigned
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={deselectAll} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
              Deselect All
            </button>
          </div>
          <span className="text-xs text-slate-500">{filtered.length} shown</span>
        </div>

        {/* Student List */}
        <div className="overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-semibold">No students found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(student => {
                const isChecked = selected.has(student.id);
                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors ${student.is_assigned ? 'bg-emerald-50/30' : ''}`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => !student.is_assigned && toggleStudent(student.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        student.is_assigned
                          ? 'bg-emerald-500 border-emerald-500 cursor-default'
                          : isChecked
                            ? 'bg-indigo-600 border-indigo-600 cursor-pointer'
                            : 'border-slate-300 hover:border-indigo-400 cursor-pointer'
                      }`}
                      disabled={student.is_assigned}
                    >
                      {(student.is_assigned || isChecked) && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">{student.full_name}</p>
                        {student.is_assigned && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">Assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                        {student.enrollment_number && <span>#{student.enrollment_number}</span>}
                        {student.branch && <span>• {student.branch}</span>}
                        {student.semester && <span>• Sem {student.semester}</span>}
                      </div>
                    </div>

                    {/* Remove button for assigned students */}
                    {student.is_assigned && (
                      <button
                        onClick={() => handleRemove(student.id)}
                        disabled={isSubmitting}
                        title="Remove assignment"
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {newlySelectedCount > 0 ? (
              <span className="font-bold text-indigo-600">{newlySelectedCount} student{newlySelectedCount !== 1 ? 's' : ''} selected to assign</span>
            ) : (
              'Select students to assign them to this exam'
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Done
            </button>
            {newlySelectedCount > 0 && (
              <button
                onClick={handleAssign}
                disabled={isSubmitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition-all ${
                  isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Assign {newlySelectedCount} Student{newlySelectedCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStudents;
