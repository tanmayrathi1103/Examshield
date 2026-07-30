import apiClient from './axios';
import type { 
  QuestionResponse, QuestionCreate, QuestionUpdate, QuestionListResponse 
} from '../types';

export const questionsApi = {
  createQuestion: async (questionData: QuestionCreate): Promise<QuestionResponse> => {
    const response = await apiClient.post<QuestionResponse>('/questions', questionData);
    return response.data;
  },

  getQuestion: async (id: string): Promise<QuestionResponse> => {
    const response = await apiClient.get<QuestionResponse>(`/questions/${id}`);
    return response.data;
  },

  updateQuestion: async (id: string, questionData: QuestionUpdate): Promise<QuestionResponse> => {
    const response = await apiClient.put<QuestionResponse>(`/questions/${id}`, questionData);
    return response.data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await apiClient.delete(`/questions/${id}`);
  },

  duplicateQuestion: async (id: string): Promise<QuestionResponse> => {
    const response = await apiClient.post<QuestionResponse>(`/questions/${id}/duplicate`);
    return response.data;
  },
  
  listQuestionsForExam: async (examId: string, skip: number = 0, limit: number = 100): Promise<QuestionListResponse> => {
    const response = await apiClient.get<QuestionListResponse>(`/exams/${examId}/questions?skip=${skip}&limit=${limit}`);
    return response.data;
  }
};
