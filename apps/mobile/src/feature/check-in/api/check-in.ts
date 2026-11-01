import { useMutation } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { CheckInTarget } from '@/feature/check-in/helpers/check-in-code';

export function useCheckInMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async ({ lessonId, code }: CheckInTarget) => {
      const response = await request(api.account['check-in'].$post({ json: { lessonId, code } }));

      return response.data;
    }
  });
}
