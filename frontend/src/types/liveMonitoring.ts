export interface LiveViolationEvent {
  id: string;
  event_type: string;
  severity: string;
  timestamp: string;
  event_data: Record<string, any>;
}

export interface LiveStudentSessionResponse {
  attempt_id: string;
  student_id: string;
  student_name: string;
  roll_no?: string;
  department?: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'submitted' | 'auto_submitted' | 'evaluated';
  started_at?: string;
  submitted_at?: string;
  integrity_score: number;
  answered_questions: number;
  total_questions: number;
  violations_count: number;
  recent_events: LiveViolationEvent[];
}

export interface LiveExamMonitoringResponse {
  exam_id: string;
  exam_title: string;
  exam_code: string;
  active_count: number;
  sessions: LiveStudentSessionResponse[];
}

export interface LiveActiveStudentItem {
  student_id: string;
  student_name: string;
  email: string;
  roll_no?: string;
  department?: string;
  attempt_id: string;
  started_at?: string;
  status: string;
  violations_count: number;
  integrity_score: number;
}

export interface LiveExamOverviewItem {
  exam_id: string;
  exam_title: string;
  exam_code: string;
  subject?: string;
  status: string;
  duration_minutes: number;
  total_marks: number;
  active_count: number;
  total_enrolled: number;
  students: LiveActiveStudentItem[];
}

export interface LiveMonitoringOverviewResponse {
  total_active_students: number;
  active_exams_count: number;
  exams: LiveExamOverviewItem[];
}

