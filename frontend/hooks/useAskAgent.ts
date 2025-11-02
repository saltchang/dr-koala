import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '@/types/apiSchema';
import { streamFunction } from '@/utils/fetch';
import { useTopicSession } from './useTopicSession';
import { useTopicSessions } from './useTopicSessions';

interface UseAskAgentResult {
  content: string;
  isLoading: boolean;
  error: Error | null;
  submitQuestion: (query: string, sessionId: string) => Promise<void>;
  reset: () => void;
}

interface StreamVariables {
  query: string;
  sessionId: string;
}

export const useAskAgent = (): UseAskAgentResult => {
  const [content, setContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const {
    mutateAsync: askAgent,
    reset: resetAskAgent,
    isPending: isAskingAgent,
    error: askAgentError,
  } = useMutation<void, Error, StreamVariables>({
    mutationFn: async ({ query, sessionId }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setContent('');

      return streamFunction<components['schemas']['AskAgentRequest'], never>({
        path: '/ask-agent',
        request: {
          query,
          session_id: sessionId,
        },
        onChunk: (chunk) => {
          if (chunk.content) {
            setContent((prev) => prev + chunk.content);
          }
        },
        onError: (error) => {
          throw error;
        },
        onComplete: () => {
          queryClient.invalidateQueries({
            queryKey: useTopicSession.getQueryKey(sessionId),
          });
          queryClient.invalidateQueries({
            queryKey: useTopicSessions.getQueryKey(),
          });
        },
        signal: abortControllerRef.current.signal,
      });
    },
  });

  const submitQuestion = useCallback(
    async (query: string, sessionId: string) => {
      if (!query.trim()) {
        throw new Error('Please enter a question');
      }

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      await askAgent({ query, sessionId });
    },
    [askAgent],
  );

  const reset = useCallback(() => {
    setContent('');
    resetAskAgent();
  }, [resetAskAgent]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const data = useMemo(
    () => ({
      content,
      isLoading: isAskingAgent,
      error: askAgentError,
      submitQuestion,
      reset,
    }),
    [content, isAskingAgent, askAgentError, submitQuestion, reset],
  );

  return data;
};
