import { useState, useCallback } from 'react';
import { questionsApi } from '../api/questions';
import type { QuestionResponse, QuestionCreate, QuestionUpdate } from '../types';

export const useQuestions = () => {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionsForExam = useCallback(async (examId: string, skip = 0, limit = 100) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await questionsApi.listQuestionsForExam(examId, skip, limit);
      setQuestions(data.items);
      return data.items;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch questions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createQuestion = useCallback(async (questionData: QuestionCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      const newQuestion = await questionsApi.createQuestion(questionData);
      setQuestions(prev => [...prev, newQuestion]);
      return newQuestion;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create question');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuestion = useCallback(async (id: string, questionData: QuestionUpdate) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await questionsApi.updateQuestion(id, questionData);
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update question');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteQuestion = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await questionsApi.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete question');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    questions,
    isLoading,
    error,
    fetchQuestionsForExam,
    createQuestion,
    updateQuestion,
    deleteQuestion
  };
};
