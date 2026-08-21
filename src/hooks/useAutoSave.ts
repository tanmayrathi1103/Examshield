import { useCallback, useRef } from 'react';
import { attemptsApi, type UpdateAnswerPayload, type StudentAnswer } from '../api/attempts';

export function useAutoSave(attemptId: string | undefined) {
  // Use a ref to store active timeouts for debouncing per question
  const timeouts = useRef<{ [questionId: string]: ReturnType<typeof setTimeout> }>({});

  const saveAnswer = useCallback((
    questionId: string, 
    data: UpdateAnswerPayload, 
    onSuccess?: (savedAnswer: StudentAnswer) => void,
    onError?: (err: any) => void
  ) => {
    if (!attemptId) return;

    // Clear any pending save for this specific question
    if (timeouts.current[questionId]) {
      clearTimeout(timeouts.current[questionId]);
    }

    // Set a new timeout to save after 1000ms of inactivity (debounce)
    timeouts.current[questionId] = setTimeout(async () => {
      try {
        const saved = await attemptsApi.updateAnswer(attemptId, questionId, data);
        if (onSuccess) onSuccess(saved);
      } catch (err) {
        console.error("Auto-save failed:", err);
        if (onError) onError(err);
      } finally {
        delete timeouts.current[questionId];
      }
    }, 1000);
  }, [attemptId]);

  // Immediately save (bypassing debounce) - useful for "Mark for Review" or leaving the page
  const saveImmediate = useCallback(async (
    questionId: string, 
    data: UpdateAnswerPayload
  ) => {
    if (!attemptId) return null;
    
    if (timeouts.current[questionId]) {
      clearTimeout(timeouts.current[questionId]);
      delete timeouts.current[questionId];
    }
    
    try {
      return await attemptsApi.updateAnswer(attemptId, questionId, data);
    } catch (err) {
      console.error("Immediate save failed:", err);
      throw err;
    }
  }, [attemptId]);

  return { saveAnswer, saveImmediate };
}
