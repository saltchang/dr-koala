import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mutationFunction } from '@/utils/fetch';
import { useTopicSessions } from './useTopicSessions';

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { sessionId: string }>({
    mutationFn: ({ sessionId }) =>
      mutationFunction<void, { success: boolean }>({
        path: `/sessions/${sessionId}`,
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: useTopicSessions.getQueryKey(),
      });
    },
  });
};
