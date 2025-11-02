import { useMutation } from '@tanstack/react-query';
import type { components } from '@/types/apiSchema';
import { mutationFunction } from '@/utils/fetch';

export const useCreateSession = () => {
  return useMutation<components['schemas']['SessionHistoryResponseModel']>({
    mutationFn: () =>
      mutationFunction<void, components['schemas']['SessionHistoryResponseModel']>({
        path: '/sessions',
      }),
  });
};
