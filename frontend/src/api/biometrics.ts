import apiClient from './axios';
import type {
  BiometricRegisterRequest,
  BiometricRegisterResponse,
  BiometricVerifyRequest,
  BiometricVerifyResponse,
  BiometricStatusResponse,
  BiometricDeleteResponse,
} from '../types';

export const biometricApi = {
  register: async (payload: BiometricRegisterRequest): Promise<BiometricRegisterResponse> => {
    const response = await apiClient.post<BiometricRegisterResponse>('/biometrics/register', payload);
    return response.data;
  },

  verify: async (payload: BiometricVerifyRequest): Promise<BiometricVerifyResponse> => {
    const response = await apiClient.post<BiometricVerifyResponse>('/biometrics/verify', payload);
    return response.data;
  },

  getStatus: async (): Promise<BiometricStatusResponse> => {
    const response = await apiClient.get<BiometricStatusResponse>('/biometrics/status');
    return response.data;
  },

  deleteMyData: async (): Promise<BiometricDeleteResponse> => {
    const response = await apiClient.delete<BiometricDeleteResponse>('/biometrics/my-data');
    return response.data;
  },
};
