import { ROLE } from '@cio/utils/constants/roles';

import { useAccountQuery } from '@/feature/account/api/account';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

/** The signed-in user's active organization and their role in it, once the account has loaded. */
export function useActiveOrg() {
  const account = useAccountQuery();
  const activeOrgId = useActiveOrgId();
  const organizations = account.data?.organizations ?? [];
  const org = organizations.find((candidate) => candidate.id === activeOrgId) ?? null;
  const roleId = org?.roleId ?? null;

  return {
    org,
    organizations,
    isLoading: account.isPending,
    isStaff: roleId === ROLE.ADMIN || roleId === ROLE.TUTOR,
    isAdmin: roleId === ROLE.ADMIN
  };
}
