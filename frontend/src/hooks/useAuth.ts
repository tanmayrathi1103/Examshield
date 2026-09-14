import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/auth';
import { getAuthToken, clearAuthTokens } from '../api/axios';
import type { UserLogin, UserRegister } from '../types';

const extractErrorMessage = (err: any, fallback: string): string => {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
};

export const useAuth = () => {
  const { currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: UserLogin) => {
    setIsLoading(true);
    setError(null);
    try {
      const { access_token } = await authApi.login(credentials);
      
      // Store in session storage (tab-isolated) and local storage
      sessionStorage.setItem('access_token', access_token);
      localStorage.setItem('access_token', access_token);

      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (path.includes('faculty')) {
        sessionStorage.setItem('faculty_access_token', access_token);
        localStorage.setItem('faculty_access_token', access_token);
      } else if (path.includes('student')) {
        sessionStorage.setItem('student_access_token', access_token);
        localStorage.setItem('student_access_token', access_token);
      } else if (path.includes('admin')) {
        sessionStorage.setItem('admin_access_token', access_token);
        localStorage.setItem('admin_access_token', access_token);
      }

      const user = await authApi.getMe();
      if (user?.role) {
        sessionStorage.setItem(`${user.role}_access_token`, access_token);
        localStorage.setItem(`${user.role}_access_token`, access_token);
        sessionStorage.setItem('current_role', user.role);
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setIsAuthenticated]);

  const register = useCallback(async (userData: UserRegister) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(userData);
      // Auto-login after registration
      return await login({ email: userData.email, password: userData.password });
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      const currentRole = currentUser?.role;
      if (currentRole) {
        clearAuthTokens(currentRole);
      } else {
        clearAuthTokens();
      }
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [currentUser, setCurrentUser, setIsAuthenticated]);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      return null;
    }
    
    setIsLoading(true);
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user?.role) {
        sessionStorage.setItem(`${user.role}_access_token`, token);
        sessionStorage.setItem('access_token', token);
      }
      return user;
    } catch (err) {
      clearAuthTokens();
      setCurrentUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setIsAuthenticated]);

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchCurrentUser
  };
};
