import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '@/types/apiSchema';
import type { ProcessingStep } from '@/types/topicSession';
import { streamFunction } from '@/utils/fetch';
import { useTopicSession } from './useTopicSession';
import { useTopicSessions } from './useTopicSessions';

interface UseAskAgentResult {
  content: string;
  steps: ProcessingStep[];
  currentStep: string | null;
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
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const {
    mutateAsync: askAgent,
    reset: resetAskAgent,
    isPending: isAskingAgent,
    error: askAgentError,
  } = useMutation<void, Error, StreamVariables>({
    mutationFn: async ({ query, sessionId }) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setContent('');
      setSteps([]);
      setCurrentStep(null);

      try {
        await streamFunction<
          components['schemas']['AskAgentRequest'],
          components['schemas']['AskAgentResponseStreamChunkModel']
        >({
          path: '/ask-agent',
          method: 'POST',
          request: {
            query,
            session_id: sessionId,
          },
          onChunk: (chunk) => {
            if (chunk.content) {
              setContent((prev) => prev + chunk.content);
            }

            if (!chunk.step_description || !chunk.step_status) {
              return;
            }

            const newStep: ProcessingStep = {
              description: chunk.step_description,
              status: chunk.step_status,
              timestamp: new Date().toISOString(),
            };

            if (chunk.step_status === 'completed') {
              setSteps((prev) => {
                const existingIndex = prev.findIndex(
                  (s) => s.description === chunk.step_description && s.status === 'in_progress',
                );
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = newStep;
                  return updated;
                }
                return [...prev, newStep];
              });
              setCurrentStep(null);
              return;
            }

            // in_progress step
            setCurrentStep(chunk.step_description);
            setSteps((prev) => [...prev, newStep]);
          },
          onError: (error) => {
            if (error.name !== 'AbortError') {
              throw error;
            }
          },
          onComplete: () => {
            setCurrentStep(null);
            queryClient.invalidateQueries({
              queryKey: useTopicSession.getQueryKey(sessionId),
            });
            queryClient.invalidateQueries({
              queryKey: useTopicSessions.getQueryKey(),
            });
          },
          signal: controller.signal,
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
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
    setSteps([]);
    setCurrentStep(null);
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
      steps,
      currentStep,
      isLoading: isAskingAgent,
      error: askAgentError,
      submitQuestion,
      reset,
    }),
    [content, steps, currentStep, isAskingAgent, askAgentError, submitQuestion, reset],
  );

  return data;
};
