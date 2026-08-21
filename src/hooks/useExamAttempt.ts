import { useState, useEffect, useCallback } from 'react';
import { attemptsApi, type ExamAttempt } from '../api/attempts';

export function useExamAttempt(examId: string | undefined, attemptId: string | undefined) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOrResume = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attemptsApi.startAttempt(examId);
      setAttempt(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start exam');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attemptsApi.getAttempt(attemptId);
      setAttempt(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load attempt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  const submitAttempt = useCallback(async () => {
    if (!attempt?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attemptsApi.submitAttempt(attempt.id);
      setAttempt(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit exam');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attempt?.id]);

  return {
    attempt,
    setAttempt, // to update local state optimistically
    loading,
    error,
    startOrResume,
    loadAttempt,
    submitAttempt
  };
}
