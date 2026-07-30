import apiClient from './axios';
import type { 
  ExamListResponse, ExamResponse, ExamCreate, ExamUpdate, 
  ExamAssignmentListResponse, ExamAssignmentResponse,
  StartExamRequest, SubmitExamRequest, ExamResultResponse 
} from '../types';

export const examsApi = {
  // Common Exam Listing (Role based handled on backend)
  listExams: async (skip: number = 0, limit: number = 100): Promise<ExamListResponse> => {
    const response = await apiClient.get<ExamListResponse>(`/exams?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getExam: async (id: string): Promise<ExamResponse> => {
    const response = await apiClient.get<ExamResponse>(`/exams/${id}`);
    return response.data;
  },

  createExam: async (examData: ExamCreate): Promise<ExamResponse> => {
    const response = await apiClient.post<ExamResponse>('/exams', examData);
    return response.data;
  },

  updateExam: async (id: string, examData: ExamUpdate): Promise<ExamResponse> => {
    const response = await apiClient.put<ExamResponse>(`/exams/${id}`, examData);
    return response.data;
  },

  deleteExam: async (id: string): Promise<void> => {
    await apiClient.delete(`/exams/${id}`);
  },

  publishExam: async (id: string): Promise<ExamResponse> => {
    const response = await apiClient.post<ExamResponse>(`/exams/${id}/publish`);
    return response.data;
  },

  scheduleExam: async (id: string): Promise<ExamResponse> => {
    const response = await apiClient.post<ExamResponse>(`/exams/${id}/schedule`);
    return response.data;
  },

  assignStudents: async (id: string, studentIds: string[]): Promise<ExamAssignmentResponse[]> => {
    const response = await apiClient.post<ExamAssignmentResponse[]>(`/exams/${id}/assign`, { student_ids: studentIds });
    return response.data;
  },

  getAssignments: async (id: string, skip: number = 0, limit: number = 100): Promise<ExamAssignmentListResponse> => {
    const response = await apiClient.get<ExamAssignmentListResponse>(`/exams/${id}/assignments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Student specific endpoints
  studentListExams: async (skip: number = 0, limit: number = 100): Promise<ExamListResponse> => {
    const response = await apiClient.get<ExamListResponse>(`/student/exams?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  studentGetExam: async (id: string): Promise<ExamResponse> => {
    const response = await apiClient.get<ExamResponse>(`/student/exams/${id}`);
    return response.data;
  }
};
