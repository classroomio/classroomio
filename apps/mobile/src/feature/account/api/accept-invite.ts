import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountQueryKey } from '@/feature/account/api/account';
import type { InviteKind } from '@/feature/account/types/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { setActiveOrg } from '@/feature/org/helpers/active-org-store';

export function useAcceptInviteMutation(kind: InviteKind) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const accept = async (token: string) => {
    const param = { token };
    if (kind === 'organization') return (await request(api.invite.organization[':token'].accept.$post({ param }))).data;
    if (kind === 'link') return (await request(api.invite.link[':token'].accept.$post({ param }))).data;

    return (await request(api.invite.r[':token'].accept.$post({ param }))).data;
  };

  return useMutation({
    mutationFn: accept,
    onSuccess: async ({ organizationId }) => {
      await queryClient.invalidateQueries({ queryKey: accountQueryKey(userId) });
      setActiveOrg(organizationId);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
}
