import { useState, useEffect } from 'react';

export function useExamTimer(expiresAt: string | undefined, onExpire: () => void) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const targetTime = new Date(expiresAt).getTime();
    
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      return diff;
    };

    // Initial calculation
    const initialDiff = calculateRemaining();
    setTimeRemaining(initialDiff);

    if (initialDiff <= 0) {
      onExpire();
      return;
    }

    const intervalId = setInterval(() => {
      const diff = calculateRemaining();
      setTimeRemaining(diff);

      if (diff <= 0) {
        clearInterval(intervalId);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, onExpire]);

  // Format time as HH:MM:SS
  const formattedTime = timeRemaining !== null 
    ? [
        Math.floor(timeRemaining / 3600).toString().padStart(2, '0'),
        Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0'),
        (timeRemaining % 60).toString().padStart(2, '0')
      ].join(':')
    : '--:--:--';

  return { timeRemaining, formattedTime };
}
