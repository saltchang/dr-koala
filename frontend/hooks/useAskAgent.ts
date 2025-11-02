import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '@/types/apiSchema';
import { streamFunction } from '@/utils/fetch';
import { useTopicSession } from './useTopicSession';

interface UseAskAgentResult {
  content: string;
  isLoading: boolean;
  error: Error | null;
  startStream: (query: string, sessionId: string) => void;
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

  const mutation = useMutation<void, Error, StreamVariables>({
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
        },
        signal: abortControllerRef.current.signal,
      });
    },
  });

  const startStream = useCallback(
    (query: string, sessionId: string) => {
      if (!query.trim()) {
        throw new Error('Please enter a question');
      }

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      mutation.mutate({ query, sessionId });
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setContent('');
    mutation.reset();
  }, [mutation]);

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
      isLoading: mutation.isPending,
      error: mutation.error,
      startStream,
      reset,
    }),
    [content, mutation.isPending, mutation.error, startStream, reset],
  );

  return data;
};
