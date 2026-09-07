export interface StudentDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  roll_no: string;
  department: string;
  semester?: number;
  year?: number;
  integrity_score: number;
  status: 'active' | 'suspended';
  created_at?: string;
}

export interface FacultyDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  employee_id: string;
  department: string;
  designation: string;
  assigned_courses: string[];
  status: 'active' | 'suspended';
  created_at?: string;
}

export interface AdminActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
}

export interface AdminStatsResponse {
  total_students: number;
  total_faculty: number;
  total_exams: number;
  total_attempts: number;
  total_violations: number;
  violation_distribution: Record<string, number>;
  ai_sensitivity: string;
  recent_activity: AdminActivityItem[];
}

export interface AdminViolationItem {
  id: string;
  attempt_id: string;
  student_name: string;
  student_email: string;
  exam_title: string;
  timestamp: string;
  type: string;
  raw_event_type: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  details?: Record<string, any>;
}

export interface ViolationResolveResponse {
  id: string;
  resolved: boolean;
  message: string;
}

export interface AISettingsConfig {
  id?: string;
  face_detection: boolean;
  eye_tracking: boolean;
  phone_detection: boolean;
  voice_detection: boolean;
  multi_face_detection: boolean;
  tab_lockout: boolean;
  sensitivity: 'Low' | 'Medium' | 'High';
  allowed_violations: number;
  warnings_before_submit: number;
  updated_at?: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
}
