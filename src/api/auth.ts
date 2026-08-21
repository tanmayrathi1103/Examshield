import apiClient from './axios';
import type { UserLogin, Token, User, UserRegister, MessageResponse } from '../types';

export const authApi = {
  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: UserRegister): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  getStudents: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/auth/students');
    return response.data;
  },

  logout: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/logout');
    return response.data;
  }
};
