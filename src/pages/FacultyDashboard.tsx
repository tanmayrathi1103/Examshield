import React, { useEffect, useState } from 'react';
import { useExams } from '../hooks/useExams';
import { Users, FileText, CheckSquare, Monitor, PlusCircle, Calendar, Search, Trash2, Clock, CheckCircle, Archive, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, ConfirmDialog, EmptyState, Skeleton } from '../components/ui';

const FacultyDashboard: React.FC = () => {
  const { exams, stats, fetchExams, fetchStats, isLoading, deleteExam } = useExams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, [fetchExams, fetchStats]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteExam(confirmDelete.id);
      await fetchExams();
      await fetchStats();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Failed to delete exam', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    exam.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.exam_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Faculty Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your assessments and monitor students.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assessments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
          <Button onClick={() => navigate('/faculty/create-exam')} leftIcon={<PlusCircle className="w-4 h-4" />}>
            New
          </Button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Assessments', value: stats?.active_exams || 0, icon: <Monitor className="text-indigo-600" />, bg: 'bg-indigo-50' },
          { label: 'Scheduled Today', value: stats?.scheduled_exams || 0, icon: <Calendar className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Students Assigned', value: stats?.students_assigned || 0, icon: <Users className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Question Bank', value: stats?.total_questions || 0, icon: <CheckSquare className="text-violet-600" />, bg: 'bg-violet-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            {isLoading ? (
              <Skeleton className="w-12 h-12 rounded-xl" />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                {stat.icon}
              </div>
            )}
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Recent Assessments */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Assessments</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredExams.map(exam => (
                <Card key={exam.id} className="p-5 flex flex-col group hover:shadow-md hover:border-indigo-100 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={exam.status}>{exam.status}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/faculty/manage-exam/${exam.id}`)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Manage"
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ id: exam.id, name: exam.title })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate">{exam.title}</h3>
                  <div className="text-xs font-semibold text-slate-500 mb-4">{exam.exam_code} • {exam.subject || 'No Subject'}</div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.duration_minutes} mins
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      {exam.total_marks} Marks
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FileText} 
              title={searchQuery ? "No matching assessments" : "No assessments found"}
              description={searchQuery ? "Try a different search term." : "Create your first assessment to get started."}
              action={!searchQuery && <Button onClick={() => navigate('/faculty/create-exam')}>Create Assessment</Button>}
            />
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
          <Card className="p-4 space-y-2">
            {[
              { label: 'Create Assessment', desc: 'Build a new exam', icon: PlusCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/faculty/create-exam' },
              { label: 'Question Bank', desc: 'Manage your questions', icon: CheckSquare, color: 'text-violet-600', bg: 'bg-violet-50', path: '/faculty/questions' },
              { label: 'Live Monitor', desc: 'Watch active sessions', icon: Monitor, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/faculty/live-monitoring' },
              { label: 'Archived', desc: 'View past exams', icon: Archive, color: 'text-slate-600', bg: 'bg-slate-100', path: '/faculty/dashboard' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="w-full p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-left border border-transparent hover:border-slate-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.bg} ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{action.label}</div>
                  <div className="text-[10px] font-medium text-slate-500">{action.desc}</div>
                </div>
              </button>
            ))}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Assessment"
        message={
          <div className="space-y-2">
            <p>This action cannot be undone.</p>
            <p>Deleting this assessment will also remove all associated <strong>Questions</strong>, <strong>Student Assignments</strong>, and <strong>Exam Attempts</strong>.</p>
          </div>
        }
        confirmText="Delete Assessment"
        requireTypedConfirmation={confirmDelete?.name}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FacultyDashboard;
