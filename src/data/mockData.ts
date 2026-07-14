export interface Exam {
  id: string;
  title: string;
  code: string;
  duration: number; // in minutes
  dateTime: string;
  questionsCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  subject: string;
  department: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  points: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  integrityScore: number;
  status: 'active' | 'suspended' | 'offline';
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  courses: string[];
}

export interface ViolationLog {
  id: string;
  studentName: string;
  examTitle: string;
  timestamp: string;
  type: 'Eye Deviation' | 'Face Missing' | 'Multiple Faces' | 'Phone Detected' | 'Voice Detected' | 'Tab Switched';
  severity: 'low' | 'medium' | 'high';
  screenshotUrl?: string;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
}

export const mockExams: Exam[] = [
  { id: '1', title: 'Data Structures and Algorithms', code: 'CS201', duration: 90, dateTime: '2026-07-15T10:00:00', questionsCount: 30, status: 'upcoming', subject: 'Computer Science', department: 'CSE' },
  { id: '2', title: 'Artificial Intelligence & Neural Networks', code: 'CS402', duration: 120, dateTime: '2026-07-16T14:00:00', questionsCount: 40, status: 'upcoming', subject: 'Computer Science', department: 'CSE' },
  { id: '3', title: 'Database Management Systems', code: 'CS302', duration: 60, dateTime: '2026-07-10T09:00:00', questionsCount: 20, status: 'completed', subject: 'Computer Science', department: 'CSE' },
  { id: '4', title: 'Operating Systems', code: 'CS301', duration: 90, dateTime: '2026-07-08T11:00:00', questionsCount: 25, status: 'completed', subject: 'Computer Science', department: 'CSE' },
  { id: '5', title: 'Digital Signal Processing', code: 'EC305', duration: 120, dateTime: '2026-07-20T10:00:00', questionsCount: 35, status: 'upcoming', subject: 'Electronics', department: 'ECE' }
];

export const mockQuestions: Question[] = [
  { id: 'q1', text: 'Which data structure uses the LIFO (Last In First Out) principle?', options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'], correctOption: 1, points: 2 },
  { id: 'q2', text: 'What is the worst-case time complexity of Quick Sort?', options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'], correctOption: 1, points: 2 },
  { id: 'q3', text: 'Which of the following is NOT a characteristic of a solid transaction in DBMS?', options: ['Atomicity', 'Consistency', 'Isolation', 'Redundancy'], correctOption: 3, points: 2 },
  { id: 'q4', text: 'In context of AI, what does CNN stand for?', options: ['Computer Neural Network', 'Convolutional Neural Network', 'Complex Node Network', 'Cyclic Node Network'], correctOption: 1, points: 2 },
  { id: 'q5', text: 'Which scheduling algorithm is non-preemptive?', options: ['Round Robin', 'Shortest Job First (SJF)', 'Priority Scheduling', 'Multilevel Queue'], correctOption: 1, points: 2 }
];

export const mockStudents: Student[] = [
  { id: 's1', name: 'Tanmay Rathi', email: 'tanmay.rathi@examshield.ai', rollNo: 'CSE2201', department: 'CSE', integrityScore: 94, status: 'active' },
  { id: 's2', name: 'Akshita Nipane', email: 'akshita.nipane@examshield.ai', rollNo: 'CSE2202', department: 'CSE', integrityScore: 82, status: 'active' },
  { id: 's3', name: 'Kabir Singh', email: 'kabir.singh@examshield.ai', rollNo: 'CSE2203', department: 'CSE', integrityScore: 45, status: 'suspended' },
  { id: 's4', name: 'Akshad Jaiswal', email: 'akshad.jaiswal@examshield.ai', rollNo: 'CSE2210', department: 'ECE', integrityScore: 98, status: 'active' },
  { id: 's5', name: 'Mrunal Samrutwar', email: 'mrunal.samrutwar@examshield.ai', rollNo: 'CSE2205', department: 'CSE', integrityScore: 71, status: 'offline' }
];

export const mockFaculty: Faculty[] = [
  { id: 'f1', name: 'Dr. Harsh Dhawale', email: 'harsh.dhawale@examshield.ai', department: 'CSE', courses: ['Data Structures', 'Algorithms'] },
  { id: 'f2', name: 'Prof. Sarah Thomas', email: 'sarah.thomas@examshield.ai', department: 'ECE', courses: ['Digital Electronics', 'DSP'] },
  { id: 'f3', name: 'Dr. Vikram Rao', email: 'vikram.rao@examshield.ai', department: 'CSE', courses: ['Database Systems', 'Operating Systems'] }
];

export const mockViolations: ViolationLog[] = [
  { id: 'v1', studentName: 'Kabir Singh', examTitle: 'Data Structures and Algorithms', timestamp: '2026-07-10T10:15:30', type: 'Phone Detected', severity: 'high', resolved: false },
  { id: 'v2', studentName: 'Ishita Patel', examTitle: 'Database Management Systems', timestamp: '2026-07-10T09:22:11', type: 'Eye Deviation', severity: 'low', resolved: true },
  { id: 'v3', studentName: 'Kabir Singh', examTitle: 'Data Structures and Algorithms', timestamp: '2026-07-10T10:17:45', type: 'Face Missing', severity: 'medium', resolved: false },
  { id: 'v4', studentName: 'Rohan Verma', examTitle: 'Operating Systems', timestamp: '2026-07-08T11:45:00', type: 'Multiple Faces', severity: 'high', resolved: true },
  { id: 'v5', studentName: 'Ishita Patel', examTitle: 'Database Management Systems', timestamp: '2026-07-10T09:45:10', type: 'Tab Switched', severity: 'high', resolved: false }
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'a1', user: 'admin@examshield.ai', action: 'Changed proctoring sensitivity to HIGH', timestamp: '2026-07-10T16:30:00', ip: '192.168.1.1' },
  { id: 'a2', user: 'harsh.dhawale@examshield.ai', action: 'Created Exam: CS201', timestamp: '2026-07-10T15:22:00', ip: '192.168.1.45' },
  { id: 'a3', user: 'admin@examshield.ai', action: 'Suspended student: Kabir Singh', timestamp: '2026-07-10T11:00:00', ip: '192.168.1.1' }
];

export const mockAIConfig = {
  faceDetection: true,
  eyeTracking: true,
  phoneDetection: true,
  voiceDetection: true,
  multiFaceDetection: true,
  tabLockout: true,
  sensitivity: 'Medium', // Low, Medium, High
  allowedViolations: 3,
  warningsBeforeSubmit: 2
};
