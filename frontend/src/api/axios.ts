import axios from 'axios';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Centralized Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s default
  headers: {
    'Content-Type': 'application/json',
  },
});

// Higher timeout axios instance for biometric endpoints (DeepFace model inference is slow)
export const biometricApiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes for face recognition
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (shared logic)
const requestInterceptor = (config: any) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
biometricApiClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

// Response Interceptor (shared logic)
const responseErrorInterceptor = (error: any) => {
  if (error.response) {
    const { status } = error.response;
    if (status === 401) {
      localStorage.removeItem('access_token');
    } else if (status === 403) {
      console.error('Access forbidden');
    }
  } else if (error.request) {
    console.error('Network Error / Connection Timeout');
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use((response) => response, responseErrorInterceptor);
biometricApiClient.interceptors.response.use((response) => response, responseErrorInterceptor);

export default apiClient;
