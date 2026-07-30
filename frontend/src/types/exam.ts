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
