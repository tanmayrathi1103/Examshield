export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'archived';
export type AssignmentStatus = 'assigned' | 'started' | 'submitted' | 'absent' | 'exempted';

export interface ExamBase {
  title: string;
  description?: string;
  subject?: string;
  exam_code: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions?: string;
  start_time?: string;
  end_time?: string;
}

export interface ExamCreate extends ExamBase {}

export interface ExamUpdate extends Partial<ExamBase> {
  status?: ExamStatus;
}

export interface ExamResponse extends ExamBase {
  id: string;
  status: ExamStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  student_attempt_status?: string;
  student_attempt_id?: string;
}

export interface ExamListResponse {
  items: ExamResponse[];
  total: number;
}

export interface ExamAssignmentResponse {
  exam_id: string;
  student_id: string;
  id: string;
  assigned_at: string;
  assignment_status: AssignmentStatus;
  created_at: string;
  updated_at: string;
}

export interface ExamAssignmentListResponse {
  items: ExamAssignmentResponse[];
  total: number;
}

export interface StudentForAssignment {
  id: string;
  full_name: string;
  email: string;
  enrollment_number?: string;
  branch?: string;
  semester?: number;
  is_assigned: boolean;
}

export interface StudentForAssignmentList {
  items: StudentForAssignment[];
  total: number;
}

export interface ExamStatsResponse {
  total_exams: number;
  draft_exams: number;
  active_exams: number;
  scheduled_exams: number;
  completed_exams: number;
  total_questions: number;
  students_assigned: number;
  completed_attempts: number;
}
