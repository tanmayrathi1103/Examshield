import axios from 'axios';

// Constants
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

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

/**
 * Smart token resolver that isolates credentials across portals and browser tabs.
 * Route prefixes (e.g. /faculty, /student, /admin) determine which token to prioritize.
 */
export const getAuthToken = (customPortal?: string): string | null => {
  if (typeof window === 'undefined') return null;

  const pathname = (window.location.pathname || '').toLowerCase();
  const portal = (customPortal || '').toLowerCase();

  // Explicit prefix-based portal detection (avoids false matches like /faculty/student-reports)
  const isFaculty = 
    portal.includes('faculty') || 
    pathname.startsWith('/faculty') || 
    pathname.startsWith('/proctor') ||
    sessionStorage.getItem('current_role') === 'faculty';

  const isAdmin = 
    !isFaculty && (
      portal.includes('admin') || 
      pathname.startsWith('/admin') ||
      sessionStorage.getItem('current_role') === 'admin' ||
      sessionStorage.getItem('current_role') === 'super_admin'
    );

  const isStudent = 
    !isFaculty && !isAdmin && (
      portal.includes('student') || 
      pathname.startsWith('/student') ||
      sessionStorage.getItem('current_role') === 'student'
    );

  // 1. If in Faculty portal, prioritize faculty tokens
  if (isFaculty) {
    const tabToken = sessionStorage.getItem('faculty_access_token');
    if (tabToken) return tabToken;
    const localToken = localStorage.getItem('faculty_access_token');
    if (localToken) return localToken;
  }

  // 2. If in Admin portal, prioritize admin tokens
  if (isAdmin) {
    const tabToken = sessionStorage.getItem('admin_access_token');
    if (tabToken) return tabToken;
    const localToken = localStorage.getItem('admin_access_token');
    if (localToken) return localToken;
  }

  // 3. If in Student portal, prioritize student tokens
  if (isStudent) {
    const tabToken = sessionStorage.getItem('student_access_token');
    if (tabToken) return tabToken;
    const localToken = localStorage.getItem('student_access_token');
    if (localToken) return localToken;
  }

  // 4. Role-based check if current_role is known
  const currentRole = sessionStorage.getItem('current_role');
  if (currentRole) {
    const roleTab = sessionStorage.getItem(`${currentRole}_access_token`);
    if (roleTab) return roleTab;
    const roleLocal = localStorage.getItem(`${currentRole}_access_token`);
    if (roleLocal) return roleLocal;
  }

  // 5. Generic session token
  const sessionToken = sessionStorage.getItem('access_token');
  if (sessionToken) return sessionToken;

  // 6. Generic local token
  const localToken = localStorage.getItem('access_token');
  if (localToken) return localToken;

  // 7. Broad fallback to any available token
  return (
    sessionStorage.getItem('faculty_access_token') ||
    localStorage.getItem('faculty_access_token') ||
    sessionStorage.getItem('admin_access_token') ||
    localStorage.getItem('admin_access_token') ||
    sessionStorage.getItem('student_access_token') ||
    localStorage.getItem('student_access_token') ||
    null
  );
};

/**
 * Clears authentication tokens for a specific portal or across all storages.
 */
export const clearAuthTokens = (portal?: string) => {
  if (typeof window === 'undefined') return;

  const pathname = (window.location.pathname || '').toLowerCase();
  const searchPath = (portal || pathname).toLowerCase();
  
  if (searchPath.startsWith('/faculty') || searchPath.includes('faculty') || searchPath.includes('proctor')) {
    sessionStorage.removeItem('faculty_access_token');
    localStorage.removeItem('faculty_access_token');
  } else if (searchPath.startsWith('/admin') || searchPath.includes('admin')) {
    sessionStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_access_token');
  } else if (searchPath.startsWith('/student') || searchPath.includes('student')) {
    sessionStorage.removeItem('student_access_token');
    localStorage.removeItem('student_access_token');
  } else {
    sessionStorage.removeItem('faculty_access_token');
    localStorage.removeItem('faculty_access_token');
    sessionStorage.removeItem('student_access_token');
    localStorage.removeItem('student_access_token');
    sessionStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('access_token');
  }
};

// Request Interceptor (shared logic)
const requestInterceptor = (config: any) => {
  const token = getAuthToken();
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
      console.warn('[Axios] 401 Unauthorized encountered on:', error.config?.url);
      // Only clear tokens if the current identity verification fails on /auth/me
      if (error.config?.url?.includes('/auth/me')) {
        clearAuthTokens();
      }
    } else if (status === 403) {
      console.error('Access forbidden:', error.response?.data?.detail);
    }
  } else if (error.request) {
    console.error('Network Error / Connection Timeout');
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use((response) => response, responseErrorInterceptor);
biometricApiClient.interceptors.response.use((response) => response, responseErrorInterceptor);

export default apiClient;
