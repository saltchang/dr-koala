import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from '@/types/apiSchema';
import { mutationFunction } from '@/utils/fetch';
import { useTopicSessions } from './useTopicSessions';

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation<components['schemas']['RetrieveSessionResponseModel'], Error, { title: string }>({
    mutationFn: ({ title }) =>
      mutationFunction<
        components['schemas']['CreateSessionRequestModel'],
        components['schemas']['RetrieveSessionResponseModel']
      >({
        path: '/sessions',
        request: { title },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: useTopicSessions.getQueryKey(),
      });
    },
  });
};
