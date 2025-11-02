import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { components } from '@/types/apiSchema';
import type { TopicSession } from '@/types/topicSession';
import { queryFunction } from '@/utils/fetch';

export const useTopicSessions = () => {
  const { data, isLoading, error } = useQuery<components['schemas']['RetrieveSessionResponseModel'][]>({
    queryKey: useTopicSessions.getQueryKey(),
    queryFn: () =>
      queryFunction<components['schemas']['RetrieveSessionResponseModel'][]>({
        path: '/sessions',
      }),
  });

  const topicSessions = useMemo<TopicSession[]>(() => {
    if (!data) return [];

    return data.map((session) => {
      const query = session.title;
      const timestamp = session.turns[0]?.timestamp ?? new Date().toISOString();

      return {
        id: session.id,
        query,
        timestamp,
      };
    });
  }, [data]);

  return {
    data: topicSessions,
    isLoading,
    error,
  };
};

useTopicSessions.getQueryKey = () => ['sessions'];
