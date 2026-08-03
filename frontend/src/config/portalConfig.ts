import { GraduationCap, BookOpen, Shield } from 'lucide-react';
import React from 'react';

export interface PortalConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  theme: {
    primary: string;
    bgGradient: string;
    iconBg: string;
    shadow: string;
  };
  expectedRole: 'student' | 'faculty' | 'admin';
  redirectPath: string;
  loginPath: string;
  futureModules: string[];
  features: string[];
  requiresFaceVerification: boolean;
  requiresCamera: boolean;
  requiresMicrophone: boolean;
  requiresFullscreen: boolean;
  requiresBrowserLock: boolean;
  requiresMFA: boolean;
}

export const studentPortalConfig: PortalConfig = {
  id: 'student',
  title: 'Student Portal',
  subtitle: 'Sign in using your registered student account.',
  description: 'Access your examinations, view assigned exams, take assessments, track results, and complete AI verification.',
  icon: GraduationCap,
  theme: {
    primary: 'indigo-600',
    bgGradient: 'from-indigo-50/50 to-purple-100/50',
    iconBg: 'bg-indigo-600',
    shadow: 'shadow-indigo-500/20'
  },
  expectedRole: 'student',
  redirectPath: '/student/dashboard', // Can be updated later for face-verification etc.
  loginPath: '/login/student',
  futureModules: ['face-verification'],
  features: ['Online Examinations', 'Face Verification', 'Live AI Monitoring'],
  requiresFaceVerification: true,
  requiresCamera: true,
  requiresMicrophone: true,
  requiresFullscreen: true,
  requiresBrowserLock: true,
  requiresMFA: false,
};

export const facultyPortalConfig: PortalConfig = {
  id: 'faculty',
  title: 'Faculty Portal',
  subtitle: 'Sign in to manage examinations and students.',
  description: 'Create examinations, manage question banks, assign students, monitor ongoing exams, and review reports.',
  icon: BookOpen,
  theme: {
    primary: 'blue-600',
    bgGradient: 'from-blue-50/50 to-indigo-100/50',
    iconBg: 'bg-blue-600',
    shadow: 'shadow-blue-500/20'
  },
  expectedRole: 'faculty',
  redirectPath: '/faculty/dashboard',
  loginPath: '/login/faculty',
  futureModules: [],
  features: ['Create Assessments', 'Question Bank', 'Student Monitoring'],
  requiresFaceVerification: false,
  requiresCamera: false,
  requiresMicrophone: false,
  requiresFullscreen: false,
  requiresBrowserLock: false,
  requiresMFA: false,
};

export const adminPortalConfig: PortalConfig = {
  id: 'admin',
  title: 'Administrator Portal',
  subtitle: 'Restricted access. Authorized personnel only.',
  description: 'Manage the complete ExamShield platform, users, security, analytics, audit logs, and system configuration.',
  icon: Shield,
  theme: {
    primary: 'slate-800',
    bgGradient: 'from-slate-100/50 to-slate-200/50',
    iconBg: 'bg-slate-800',
    shadow: 'shadow-slate-500/20'
  },
  expectedRole: 'admin',
  redirectPath: '/admin/dashboard',
  loginPath: '/login/admin',
  futureModules: [],
  features: ['User Management', 'Security', 'Audit Logs'],
  requiresFaceVerification: false,
  requiresCamera: false,
  requiresMicrophone: false,
  requiresFullscreen: false,
  requiresBrowserLock: false,
  requiresMFA: true,
};

export const portals: PortalConfig[] = [
  studentPortalConfig,
  facultyPortalConfig,
  adminPortalConfig
];
