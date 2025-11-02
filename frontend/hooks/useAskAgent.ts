import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '@/types/apiSchema';
import { streamFunction } from '@/utils/fetch';
import { useTopicSession } from './useTopicSession';

interface UseAskAgentResult {
  topicSessionId: string | null;
  content: string;
  isLoading: boolean;
  error: Error | null;
  startStream: (query: string, existingSessionId?: string | null) => void;
  reset: () => void;
}

interface StreamVariables {
  query: string;
  topicSessionId?: string | null;
}

export const useAskAgent = (): UseAskAgentResult => {
  const [topicSessionId, setTopicSessionId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, StreamVariables>({
    mutationFn: async ({ query, topicSessionId: existingSessionId }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setContent('');

      return streamFunction<
        components['schemas']['AgentQueryRequest'],
        components['schemas']['AskAgentResponseStreamChunkDataModel']
      >({
        path: '/ask-agent',
        request: {
          query,
          session_id: existingSessionId,
        },
        onChunk: (chunk) => {
          if (chunk.data?.session_id) {
            setTopicSessionId(chunk.data.session_id);
          }

          if (chunk.content) {
            setContent((prev) => prev + chunk.content);
          }
        },
        onError: (error) => {
          throw error;
        },
        onComplete: () => {
          if (existingSessionId) {
            queryClient.invalidateQueries({
              queryKey: useTopicSession.getQueryKey(existingSessionId),
            });
          }
        },
        signal: abortControllerRef.current.signal,
      });
    },
  });

  const startStream = useCallback(
    (query: string, existingSessionId?: string | null) => {
      if (!query.trim()) {
        throw new Error('Please enter a question');
      }

      mutation.mutate({ query, topicSessionId: existingSessionId });
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setTopicSessionId(null);
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
      topicSessionId,
      content,
      isLoading: mutation.isPending,
      error: mutation.error,
      startStream,
      reset,
    }),
    [topicSessionId, content, mutation.isPending, mutation.error, startStream, reset],
  );

  return data;
};
