import { useCallback, useMemo, useRef } from 'react';
import type { TopicSessionHistory, TopicSessionHistoryTurn } from '@/types/topicSession';
import { useAskAgent } from './useAskAgent';
import { useTopicSession } from './useTopicSession';

interface UseTopicSessionWithStreamingResult {
  turns: TopicSessionHistoryTurn[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  submitQuestion: (query: string, sessionId: string) => Promise<void>;
  reset: () => void;
  streamingCurrentStep: string | null;
  topicSession: TopicSessionHistory | null;
}

export const useTopicSessionWithStreaming = (topicSessionId: string): UseTopicSessionWithStreamingResult => {
  const currentQueryRef = useRef<string>('');
  const initialHistoryCountRef = useRef<number>(0);
  const lastStreamingTurnRef = useRef<TopicSessionHistoryTurn | null>(null);

  const {
    content: streamingContent,
    steps: streamingSteps,
    currentStep: streamingCurrentStep,
    isLoading: isStreaming,
    error: streamingError,
    submitQuestion: originalSubmitQuestion,
    reset: originalReset,
  } = useAskAgent();

  const {
    data: topicSession,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useTopicSession(topicSessionId, !isStreaming);

  const submitQuestion = useCallback(
    async (query: string, sessionId: string) => {
      currentQueryRef.current = query;
      initialHistoryCountRef.current = topicSession?.turns.length || 0;
      await originalSubmitQuestion(query, sessionId);
    },
    [originalSubmitQuestion, topicSession?.turns.length],
  );

  const reset = useCallback(() => {
    currentQueryRef.current = '';
    lastStreamingTurnRef.current = null;
    originalReset();
  }, [originalReset]);

  const turns = useMemo<TopicSessionHistoryTurn[]>(() => {
    const historyTurns = topicSession?.turns || [];

    if (isStreaming) {
      const streamingTurn: TopicSessionHistoryTurn = {
        query: currentQueryRef.current,
        response: streamingContent,
        steps: streamingSteps,
      };
      lastStreamingTurnRef.current = streamingTurn;
      return [...historyTurns, streamingTurn];
    }

    // to see if the topic session has updated when the streaming is finished
    const historyHasNewTurn = historyTurns.length > initialHistoryCountRef.current;

    if (!historyHasNewTurn && lastStreamingTurnRef.current) {
      return [...historyTurns, lastStreamingTurnRef.current];
    }

    // topic session data updated, clear the streaming turn and show history
    lastStreamingTurnRef.current = null;
    return historyTurns;
  }, [topicSession?.turns, isStreaming, streamingContent, streamingSteps]);

  const error = streamingError || historyError;
  const isLoading = isLoadingHistory && !isStreaming;

  return {
    turns,
    isLoading,
    isStreaming,
    error,
    submitQuestion,
    reset,
    streamingCurrentStep,
    topicSession,
  };
};
