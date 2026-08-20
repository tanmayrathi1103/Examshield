import { useState, useCallback } from 'react';
import { examsApi } from '../api/exams';
import type { 
  ExamReportSummary, 
  StudentExamPerformanceResponse, 
  StudentDetailReportResponse, 
  QuestionAnalyticsResponse 
} from '../types';

export const useExamReport = (examId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<ExamReportSummary | null>(null);
  const [studentsReport, setStudentsReport] = useState<StudentExamPerformanceResponse | null>(null);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalyticsResponse | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailReportResponse | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsApi.getExamReportSummary(examId);
      setSummary(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load exam summary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const fetchStudentsReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsApi.getExamStudentsReport(examId);
      setStudentsReport(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load students report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const fetchQuestionAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsApi.getQuestionAnalytics(examId);
      setQuestionAnalytics(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load question analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const fetchStudentDetail = useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsApi.getStudentDetailReport(examId, studentId);
      setStudentDetail(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load student detail report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const fetchAllReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, stuData, qData] = await Promise.all([
        examsApi.getExamReportSummary(examId),
        examsApi.getExamStudentsReport(examId),
        examsApi.getQuestionAnalytics(examId)
      ]);
      setSummary(sumData);
      setStudentsReport(stuData);
      setQuestionAnalytics(qData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  return {
    summary,
    studentsReport,
    questionAnalytics,
    studentDetail,
    loading,
    error,
    fetchSummary,
    fetchStudentsReport,
    fetchQuestionAnalytics,
    fetchStudentDetail,
    fetchAllReports
  };
};
