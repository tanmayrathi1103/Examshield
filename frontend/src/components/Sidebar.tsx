import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, User, CheckSquare, Camera, CheckCircle2, ShieldAlert,
  History, BookOpen, UserCheck, Settings, AlertTriangle, FileText, Database, PlusCircle, Monitor, Users,
  ChevronDown, ChevronRight, Layers, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { userRole, isSidebarCollapsed, toggleSidebar } = useApp();

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
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 transition-all duration-300 ease-in-out relative z-30 select-none`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 flex-shrink-0">
            ES
          </span>
          {!isSidebarCollapsed && (
            <span className="font-extrabold text-white text-base tracking-tight truncate">
              ExamShield AI
            </span>
          )}
        </div>

        {/* Sidebar Toggle Hamburger Icon */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 active:bg-slate-700 rounded-xl transition-all duration-200"
          title={isSidebarCollapsed ? "Expand Sidebar (☰)" : "Collapse Sidebar (☰)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mini Mode vs Full Mode Menu */}
      {isSidebarCollapsed ? (
        /* MINI ICON ONLY MODE */
        <div className="flex-1 py-4 space-y-2 flex flex-col items-center">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={link.label}
                className={({ isActive }) =>
                  `w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group active:scale-90 active:opacity-75 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              </NavLink>
            );
          })}
        </div>
      ) : (
        /* FULL EXPANDABLE MENU MODE */
        <div className="flex-1 flex flex-col">
          {/* Minimal Menu Toggle Button */}
          <div className="px-3 py-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-98 text-xs font-semibold text-slate-300 transition-all duration-200 border border-slate-750/60"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="capitalize">{userRole} Navigation</span>
              </div>
              {isMenuOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Nav Links */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 space-y-1 overflow-hidden"
              >
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-98 active:opacity-75 ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                            : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 mt-auto">
        <div className="bg-slate-800/40 p-3 rounded-xl flex flex-col gap-1">
          {!isSidebarCollapsed && <div className="text-xs text-slate-400">Proctoring Status</div>}
          <div className={`flex items-center gap-2 text-xs font-semibold text-emerald-400 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {!isSidebarCollapsed && 'Active Shield'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
