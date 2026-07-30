import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  type Exam, type Question, type Student, type Faculty, type ViolationLog, type AuditLog,
  mockExams, mockQuestions, mockStudents, mockFaculty, mockViolations, mockAuditLogs, mockAIConfig 
} from '../data/mockData';
import type { User } from '../types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: 'student' | 'faculty' | 'admin' | 'guest';
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  faculties: Faculty[];
  setFaculties: React.Dispatch<React.SetStateAction<Faculty[]>>;
  violations: ViolationLog[];
  setViolations: React.Dispatch<React.SetStateAction<ViolationLog[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  aiConfig: typeof mockAIConfig;
  setAiConfig: React.Dispatch<React.SetStateAction<typeof mockAIConfig>>;
  
  // Student active exam states
  activeExamId: string | null;
  setActiveExamId: (id: string | null) => void;
  studentAnswers: Record<string, number>; // questionId -> optionIndex
  setStudentAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  examStartedAt: number | null;
  setExamStartedAt: (time: number | null) => void;
  
  // Simulation and Proctoring trigger states
  isExamFullscreen: boolean;
  setIsExamFullscreen: (val: boolean) => void;
  isCamOn: boolean;
  setIsCamOn: (val: boolean) => void;
  isMicOn: boolean;
  setIsMicOn: (val: boolean) => void;
  isInternetStable: boolean;
  setIsInternetStable: (val: boolean) => void;
  isBrowserSecure: boolean;
  setIsBrowserSecure: (val: boolean) => void;
  faceRegistered: boolean;
  setFaceRegistered: (val: boolean) => void;
  faceVerified: boolean;
  setFaceVerified: (val: boolean) => void;
  
  // Method to log custom violations dynamically
  addViolation: (type: ViolationLog['type'], severity: ViolationLog['severity']) => void;
  addAuditLog: (action: string) => void;
  resetExamState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userRole = currentUser?.role || 'guest';
  
  // Temporary mock states for incremental migration
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [faculties, setFaculties] = useState<Faculty[]>(mockFaculty);
  const [violations, setViolations] = useState<ViolationLog[]>(mockViolations);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [aiConfig, setAiConfig] = useState(mockAIConfig);



  // Student specific exam states
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number>>({});
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);

  // System checks (defaults to true or false depending on initial check page)
  const [isExamFullscreen, setIsExamFullscreen] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isInternetStable, setIsInternetStable] = useState(true);
  const [isBrowserSecure, setIsBrowserSecure] = useState(true);
  
  // Facial verification states
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);

  const addViolation = (type: ViolationLog['type'], severity: ViolationLog['severity']) => {
    const newViolation: ViolationLog = {
      id: `v_${Date.now()}`,
      studentName: currentUser?.full_name || 'Simulated Student',
      examTitle: exams.find(e => e.id === activeExamId)?.title || 'General Examination',
      timestamp: new Date().toISOString(),
      type,
      severity,
      resolved: false
    };
    setViolations(prev => [newViolation, ...prev]);
  };

  const addAuditLog = (action: string) => {
    const newLog: AuditLog = {
      id: `a_${Date.now()}`,
      user: currentUser?.email || 'unknown',
      action,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const resetExamState = () => {
    setActiveExamId(null);
    setStudentAnswers({});
    setExamStartedAt(null);
    setIsExamFullscreen(false);
    setFaceVerified(false);
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      isAuthenticated, setIsAuthenticated,
      userRole,
      exams, setExams,
      questions, setQuestions,
      students, setStudents,
      faculties, setFaculties,
      violations, setViolations,
      auditLogs, setAuditLogs,
      aiConfig, setAiConfig,
      activeExamId, setActiveExamId,
      studentAnswers, setStudentAnswers,
      examStartedAt, setExamStartedAt,
      isExamFullscreen, setIsExamFullscreen,
      isCamOn, setIsCamOn,
      isMicOn, setIsMicOn,
      isInternetStable, setIsInternetStable,
      isBrowserSecure, setIsBrowserSecure,
      faceRegistered, setFaceRegistered,
      faceVerified, setFaceVerified,
      addViolation,
      addAuditLog,
      resetExamState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
