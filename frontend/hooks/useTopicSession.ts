import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { components } from '@/types/apiSchema';
import type { TopicSessionHistory } from '@/types/topicSession';
import { queryFunction } from '@/utils/fetch';

export const useTopicSession = (topicSessionId: string, enabled: boolean) => {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<components['schemas']['RetrieveSessionResponseModel']>({
    queryKey: useTopicSession.getQueryKey(topicSessionId),
    queryFn: () => queryFunction({ path: `/sessions/${topicSessionId}` }),
    enabled,
  });

  const data = useMemo<TopicSessionHistory | null>(() => {
    if (!rawData) return null;

    return {
      id: rawData.id,
      turns: rawData.turns,
      inProgressQuery: rawData.in_progress_query ?? null,
    };
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
  };
};

useTopicSession.getQueryKey = (topicSessionId: string) => ['agent', 'topicSession', topicSessionId];
