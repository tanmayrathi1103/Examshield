import api from './axios';

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option?: string;
  descriptive_answer?: string;
  is_marked_for_review: boolean;
  is_answered: boolean;
  answered_at?: string;
}

export interface ExamAttempt {
  id: string;
  assignment_id: string;
  student_id: string;
  exam_id: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'submitted' | 'auto_submitted' | 'evaluated' | 'under_review';
  started_at?: string;
  submitted_at?: string;
  expires_at?: string;
  score?: number;
  percentage?: number;
  total_questions: number;
  answered_questions: number;
  answers: StudentAnswer[];
  
  risk_score?: number;
  face_verified?: boolean;
  fullscreen_status?: boolean;
  camera_status?: boolean;
}

export interface AttemptSummary {
  id: string;
  status: string;
  score?: number;
  percentage?: number;
  total_questions: number;
  answered_questions: number;
  submitted_at?: string;
  risk_score?: number;
}

export interface UpdateAnswerPayload {
  selected_option?: string;
  descriptive_answer?: string;
  is_marked_for_review?: boolean;
}

export const attemptsApi = {
  /**
   * Start or resume an exam attempt
   */
  startAttempt: async (examId: string): Promise<ExamAttempt> => {
    const response = await api.post(`/student/exams/${examId}/start`);
    return response.data;
  },

  /**
   * Get an existing attempt (e.g., after refresh)
   */
  getAttempt: async (attemptId: string): Promise<ExamAttempt> => {
    const response = await api.get(`/student/attempts/${attemptId}`);
    return response.data;
  },

  /**
   * Auto-save a specific answer
   */
  updateAnswer: async (attemptId: string, questionId: string, data: UpdateAnswerPayload): Promise<StudentAnswer> => {
    const response = await api.patch(`/student/attempts/${attemptId}/answer`, data, {
      params: { question_id: questionId }
    });
    return response.data;
  },

  /**
   * Finalize and submit the exam
   */
  submitAttempt: async (attemptId: string): Promise<ExamAttempt> => {
    const response = await api.post(`/student/attempts/${attemptId}/submit`);
    return response.data;
  },

  /**
   * Fetch the summary of a submitted exam
   */
  getSummary: async (attemptId: string): Promise<AttemptSummary> => {
    const response = await api.get(`/student/attempts/${attemptId}/summary`);
    return response.data;
  }
};
