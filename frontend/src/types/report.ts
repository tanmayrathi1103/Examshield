export interface ExamReportSummary {
  exam_id: string;
  title: string;
  subject?: string;
  exam_code?: string;
  duration_minutes?: number;
  total_marks: number;
  passing_marks: number;
  status: string;
  start_time?: string;
  end_time?: string;
  
  total_assigned: number;
  total_attempted: number;
  total_submitted: number;
  total_auto_submitted: number;
  total_not_attempted: number;
  total_passed: number;
  total_failed: number;
  
  average_score: number;
  highest_score: number;
  lowest_score: number;
  average_percentage: number;
  pass_percentage: number;
  completion_percentage: number;
  
  average_time_taken_mins: number;
  fastest_attempt_mins: number;
  longest_attempt_mins: number;
  
  total_questions: number;
  objective_questions: number;
  descriptive_questions: number;
  average_question_accuracy: number;
}

export interface StudentPerformanceRecord {
  student_id: string;
  name: string;
  enrollment_number?: string;
  branch?: string;
  semester?: string;
  
  attempt_id?: string;
  attempt_status?: string;
  started_at?: string;
  submitted_at?: string;
  time_taken_mins?: number;
  
  marks_obtained?: number;
  total_marks: number;
  percentage?: number;
  result: string;
  submission_type?: string;
}

export interface StudentExamPerformanceResponse {
  exam_id: string;
  students: StudentPerformanceRecord[];
}

export interface QuestionDetailReport {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  marks: number;
  
  student_answer?: string;
  correct_answer?: string;
  marks_obtained: number;
  evaluation_status: string;
}

export interface StudentDetailReportResponse {
  student: StudentPerformanceRecord;
  questions: QuestionDetailReport[];
}

export interface QuestionPerformanceRecord {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  max_marks: number;
  
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy_percentage: number;
  average_marks: number;
  difficulty_level: string;
}

export interface QuestionAnalyticsResponse {
  exam_id: string;
  questions: QuestionPerformanceRecord[];
}
