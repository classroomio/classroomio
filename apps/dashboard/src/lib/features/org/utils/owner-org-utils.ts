import type { AccountOrg } from '$features/app/types';

/**
 * Returns the account org that owns a course or cohort, or null when it is already current or the user is not in it.
 */
export function findOwnerOrgToSwitch(
  ownerOrgId: string | null | undefined,
  currentOrgId: string | undefined,
  accountOrgs: AccountOrg[]
): AccountOrg | null {
  if (!ownerOrgId || ownerOrgId === currentOrgId) return null;

  return accountOrgs.find((org) => org.id === ownerOrgId) ?? null;
}
