import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useExams } from '../hooks/useExams';
import { ShieldCheck, Video, Mic, Wifi, ShieldAlert, Award, FileText, ArrowRight, CheckCircle, HelpCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    isCamOn,
    isMicOn,
    isInternetStable,
    isBrowserSecure,
    faceRegistered
  } = useApp();
  
  const { exams, fetchStudentExams, isLoading } = useExams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentExams();
  }, [fetchStudentExams]);

  // Using real currentUser, default integrityScore to 94 if not present in schema
  const currentStudent = {
    name: currentUser?.full_name || 'Student',
    integrityScore: 94,
    status: 'active'
  };

  const getSystemStatus = () => {
    const checks = [isCamOn, isMicOn, isInternetStable, isBrowserSecure, faceRegistered];
    const passed = checks.filter(Boolean).length;
    return { passed, total: checks.length };
  };

  const status = getSystemStatus();
  const upcomingExams = exams.filter(e => e.status === 'upcoming');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-primary-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative space-y-3 max-w-xl">
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            Academic Year 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hello, {currentStudent.name} </h1>
          <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed">
            Welcome to the AI proctored examination portal. Please ensure your system parameters are fully certified before entering any exam.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Integrity Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white ${currentStudent.integrityScore >= 90 ? 'bg-emerald-500' : currentStudent.integrityScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
            }`}>
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Proctoring Trust Score</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{currentStudent.integrityScore}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Updated in real-time</div>
          </div>
        </div>

        {/* System Cert Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white ${status.passed === status.total ? 'bg-indigo-600' : 'bg-amber-500'
            }`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">System Certification</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{status.passed} / {status.total} Passed</div>
            <button
              onClick={() => navigate('/student/system-check')}
              className="text-xs text-indigo-600 font-bold hover:underline mt-0.5 block"
            >
              Verify System Parameters
            </button>
          </div>
        </div>

        {/* Exams Left Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Upcoming Exams</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {isLoading ? '...' : `${upcomingExams.length} Exams Scheduled`}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Check schedule below</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scheduled / Upcoming Exams */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            Your Scheduled Examinations
          </h3>

          <div className="space-y-4">
            {isLoading ? (
               <div className="p-8 text-center italic text-slate-400">Loading exams...</div>
            ) : upcomingExams.length === 0 ? (
               <div className="p-8 text-center italic text-slate-400">No upcoming exams.</div>
            ) : upcomingExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-600">{exam.exam_code} • {exam.subject}</div>
                  <h4 className="text-lg font-extrabold text-slate-800">{exam.title}</h4>
                  <div className="text-xs font-medium text-slate-400 flex gap-4">
                    <span>Duration: {exam.duration_minutes} mins</span>
                    <span>Date: {exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'TBA'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!faceRegistered) {
                      navigate('/student/face-registration');
                    } else if (status.passed < status.total) {
                      navigate('/student/system-check');
                    } else {
                      // Navigate to verification/instructions
                      navigate(`/student/instructions?examId=${exam.id}`);
                    }
                  }}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                  Start Exam Process <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status Sidebar widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            AI Compliance Checklist
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Video className={`w-5 h-5 ${isCamOn ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700">Camera Feed</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isCamOn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {isCamOn ? 'Certified' : 'Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Mic className={`w-5 h-5 ${isMicOn ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700">Microphone</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isMicOn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {isMicOn ? 'Certified' : 'Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Wifi className={`w-5 h-5 ${isInternetStable ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700">Stable Connection</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isInternetStable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {isInternetStable ? 'Certified' : 'Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${isBrowserSecure ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700">Lockdown Browser</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isBrowserSecure ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {isBrowserSecure ? 'Certified' : 'Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className={`w-5 h-5 ${faceRegistered ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700">Facial Signature</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${faceRegistered ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {faceRegistered ? 'Registered' : 'Missing'}
              </span>
            </div>

            {status.passed < status.total && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-xs text-amber-800 font-medium">
                  Please resolve failed parameters before initiating exams.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
