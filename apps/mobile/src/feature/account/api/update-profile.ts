import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountQueryKey } from '@/feature/account/api/account';
import type { UpdateProfileInput } from '@/feature/account/types/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';

export function useUpdateProfileMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => request(api.account.profile.$put({ json: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountQueryKey(userId) })
  });
}
