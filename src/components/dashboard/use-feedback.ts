'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}

export function useFeedback(timeoutMs = 4000) {
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer]
  );

  const showFeedback = useCallback(
    (type: FeedbackMessage['type'], text: string) => {
      clearTimer();
      setFeedback({ type, text });
      timeoutRef.current = setTimeout(() => setFeedback(null), timeoutMs);
    },
    [clearTimer, timeoutMs]
  );

  const dismissFeedback = useCallback(() => {
    clearTimer();
    setFeedback(null);
  }, [clearTimer]);

  const showError = useCallback(
    (text: string) => showFeedback('error', text),
    [showFeedback]
  );

  const showSuccess = useCallback(
    (text: string) => showFeedback('success', text),
    [showFeedback]
  );

  return { feedback, showFeedback, showError, showSuccess, dismissFeedback };
}
