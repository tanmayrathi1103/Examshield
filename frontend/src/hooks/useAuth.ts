import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/auth';
import type { UserLogin, UserRegister } from '../types';

export const useAuth = () => {
  const { currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: UserLogin) => {
    setIsLoading(true);
    setError(null);
    try {
      const { access_token } = await authApi.login(credentials);
      localStorage.setItem('access_token', access_token);
      
      const user = await authApi.getMe();
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
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
      setError(err.response?.data?.detail || 'Registration failed');
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
      localStorage.removeItem('access_token');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [setCurrentUser, setIsAuthenticated]);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    setIsLoading(true);
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      localStorage.removeItem('access_token');
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
