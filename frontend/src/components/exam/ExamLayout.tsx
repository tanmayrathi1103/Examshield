import React from 'react';
import { Clock, Shield, Monitor, Camera } from 'lucide-react';
import { useAuth } from '../../context/AppContext';

interface ExamLayoutProps {
  title: string;
  subject: string;
  formattedTime: string;
  children: React.ReactNode;
}

export const ExamLayout: React.FC<ExamLayoutProps> = ({ title, subject, formattedTime, children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
            <p className="text-sm text-gray-500">{subject}</p>
          </div>
        </div>

        {/* AI & System Status Indicators (Placeholders) */}
        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-green-500" />
            <span>Fullscreen</span>
          </div>
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-green-500" />
            <span>Camera Active</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">{user?.full_name}</span>
            <span className="text-xs text-gray-500">Candidate</span>
          </div>
          
          {/* Timer Display */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span className="text-xl font-mono font-bold text-indigo-900">{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {children}
      </main>
    </div>
  );
};
