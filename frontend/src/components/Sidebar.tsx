import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, User, CheckSquare, Camera, CheckCircle2, ShieldAlert,
  History, BookOpen, UserCheck, Settings, AlertTriangle, FileText, Database, PlusCircle, Monitor, Users
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { userRole } = useApp();

  const getLinks = () => {
    switch (userRole) {
      case 'student':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/history', label: 'Exam History', icon: History },
          { to: '/student/system-check', label: 'System Check', icon: CheckSquare },
          { to: '/student/face-registration', label: 'Face Registration', icon: Camera },
          { to: '/student/face-verification', label: 'Face Verification', icon: UserCheck },
        ];
      case 'faculty':
        return [
          { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { to: '/faculty/questions', label: 'Question Bank', icon: Database },
          { to: '/faculty/create-exam', label: 'Create Exam', icon: PlusCircle },
          { to: '/faculty/live-monitoring', label: 'Live Monitoring', icon: Monitor },
          { to: '/faculty/student-reports', label: 'Student Reports', icon: FileText },
        ];
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/students', label: 'Students Directory', icon: Users },
          { to: '/admin/faculty', label: 'Faculty Directory', icon: UserCheck },
          { to: '/admin/ai-settings', label: 'AI Monitoring', icon: Settings },
          { to: '/admin/violation-logs', label: 'Violation Logs', icon: ShieldAlert },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
          { to: '/admin/settings', label: 'System Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">ES</span>
        <span className="font-extrabold text-white text-lg tracking-tight">ExamShield AI</span>
      </div>
      
      <div className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {userRole} portal
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'hover:bg-slate-800/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/40 p-4 rounded-xl flex flex-col gap-1">
          <div className="text-xs text-slate-400">Proctoring Status</div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active Shield
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
