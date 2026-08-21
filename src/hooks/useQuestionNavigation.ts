import { useState, useCallback, useMemo } from 'react';

export function useQuestionNavigation(totalQuestions: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const jumpTo = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setActiveIndex(index);
    }
  }, [totalQuestions]);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === totalQuestions - 1;

  return {
    activeIndex,
    goToNext,
    goToPrevious,
    jumpTo,
    isFirst,
    isLast
  };
}
