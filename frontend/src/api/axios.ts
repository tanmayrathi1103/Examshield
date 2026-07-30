import axios from 'axios';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Centralized Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Inject JWT token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Global error handling
      if (status === 401) {
        // Unauthorized - token might be expired
        localStorage.removeItem('access_token');
        // Handle redirect or context reset elsewhere (e.g., in AppContext or useAuth)
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden');
      }
    } else if (error.request) {
      console.error('Network Error / Connection Timeout');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
