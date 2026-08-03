import { useState, useCallback } from 'react';
import { examsApi } from '../api/exams';
import type { ExamResponse, ExamCreate, ExamUpdate, ExamStatsResponse } from '../types';

export const useExams = () => {
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamResponse | null>(null);
  const [stats, setStats] = useState<ExamStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = useCallback(async (skip = 0, limit = 100) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await examsApi.listExams(skip, limit);
      setExams(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudentExams = useCallback(async (skip = 0, limit = 100) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await examsApi.studentListExams(skip, limit);
      setExams(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExamById = useCallback(async (id: string, isStudent = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isStudent ? await examsApi.studentGetExam(id) : await examsApi.getExam(id);
      setCurrentExam(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch exam');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExam = useCallback(async (examData: ExamCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      const newExam = await examsApi.createExam(examData);
      setExams(prev => [newExam, ...prev]);
      setCurrentExam(newExam);
      return newExam;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create exam');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExam = useCallback(async (id: string, examData: ExamUpdate) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await examsApi.updateExam(id, examData);
      setExams(prev => prev.map(e => e.id === id ? updated : e));
      if (currentExam?.id === id) setCurrentExam(updated);
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update exam');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentExam]);

  const deleteExam = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await examsApi.deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
      if (currentExam?.id === id) setCurrentExam(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete exam');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentExam]);

  const publishExam = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const published = await examsApi.publishExam(id);
      setExams(prev => prev.map(e => e.id === id ? published : e));
      if (currentExam?.id === id) setCurrentExam(published);
      return published;
    } catch (err: any) {
      // Re-throw with structured error details for the UI to display
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.errors) {
        throw { errors: detail.errors, message: detail.message };
      }
      setError(typeof detail === 'string' ? detail : 'Failed to publish exam');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentExam]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await examsApi.getFacultyStats();
      setStats(data);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  return {
    exams,
    currentExam,
    stats,
    isLoading,
    error,
    fetchExams,
    fetchStudentExams,
    fetchExamById,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    fetchStats,
  };
};
