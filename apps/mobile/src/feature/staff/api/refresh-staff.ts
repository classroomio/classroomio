import { useQueryClient } from '@tanstack/react-query';

import { teachKeys, useTeachScope } from '@/feature/teach/api/teach-scope';

import { staffKeys } from './staff-keys';

/** Refetches every tutor and admin query in the active org, for pull to refresh on the staff Home. */
export function useRefreshStaff() {
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return () =>
    Promise.all([
      queryClient.refetchQueries({ queryKey: staffKeys.all(userId, orgId), type: 'active' }),
      queryClient.refetchQueries({ queryKey: teachKeys.all(userId, orgId), type: 'active' })
    ]);
}
