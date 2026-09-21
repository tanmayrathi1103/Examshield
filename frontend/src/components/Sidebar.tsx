import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, User, CheckSquare, Camera, CheckCircle2, ShieldAlert,
  History, BookOpen, UserCheck, Settings, AlertTriangle, FileText, Database, PlusCircle, Monitor, Users,
  ChevronDown, ChevronRight, Layers, PanelLeftClose, PanelLeftOpen, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { userRole, isSidebarCollapsed, toggleSidebar } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Collapsed by default as requested by user
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      case 'super_admin':
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
    <aside 
      className={`${
        isSidebarCollapsed ? 'w-0 border-transparent' : 'w-64 border-slate-800'
      } bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r transition-all duration-300 ease-in-out relative z-30 select-none`}
    >
      {/* Content wrapper - fixes width to prevent squishing and fades out when collapsed */}
      <div className={`flex flex-col h-full w-64 overflow-hidden transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Sidebar Header */}
        <div className="p-5 flex items-center h-20 relative shrink-0 border-b border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-700/50 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="ExamShield Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-lg tracking-tight truncate whitespace-nowrap">
              ExamShield
            </span>
          </div>
        </div>

        {/* FULL EXPANDABLE MENU MODE */}
        <div className="flex-1 flex flex-col overflow-y-auto py-6">
          <nav className="px-3 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      isActive 
                        ? 'text-white bg-indigo-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Premium active indicator line */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 rounded-r-full transition-all duration-300 ${isActive ? 'bg-indigo-500 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-50 group-hover:bg-slate-600'}`} />
                      
                      {/* Premium Icon Animation */}
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-300 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'}`} />
                      
                      <span className="tracking-wide">{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Status and Logout */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-2">
          <div className="bg-slate-800/40 p-3 rounded-xl flex flex-col gap-1">
            <div className="text-xs text-slate-400">Proctoring Status</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Shield
            </div>
          </div>
          
          {/* Subtle Modern Logout */}
          <button
             onClick={async () => {
               await logout();
               navigate('/login');
             }}
             className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
          >
             <span className="text-sm font-medium tracking-wide">Logout</span>
             <LogOut className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
