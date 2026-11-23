import { ROLE } from '@cio/utils/constants/roles';

import { useAccountQuery } from '@/feature/account/api/account';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export type OrgRole = 'student' | 'tutor' | 'admin';

function roleOf(roleId: number | null): OrgRole {
  if (roleId === ROLE.ADMIN) return 'admin';
  if (roleId === ROLE.TUTOR) return 'tutor';

  return 'student';
}

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
    role: roleOf(roleId),
    isStaff: roleId === ROLE.ADMIN || roleId === ROLE.TUTOR,
    isAdmin: roleId === ROLE.ADMIN
  };
}
