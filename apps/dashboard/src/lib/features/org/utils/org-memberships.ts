import { ROLE } from '@cio/utils/constants';

type MembershipOrg = {
  id: string;
  name: string;
  roleId?: number | null;
};

export type GroupedOrgMemberships<TOrg extends MembershipOrg> = {
  managed: TOrg[];
  learning: TOrg[];
};

export function isManagerMembership(org: Pick<MembershipOrg, 'roleId'>): boolean {
  return org.roleId === ROLE.ADMIN || org.roleId === ROLE.TUTOR;
}

export function isLearnerMembership(org: Pick<MembershipOrg, 'roleId'>): boolean {
  return org.roleId === ROLE.STUDENT;
}

function byName(first: MembershipOrg, second: MembershipOrg): number {
  return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
}

/**
 * Splits memberships into orgs the user runs (admin/tutor) and orgs they learn in (student), each sorted by name.
 */
export function groupOrgMemberships<TOrg extends MembershipOrg>(organizations: TOrg[]): GroupedOrgMemberships<TOrg> {
  const managed = organizations.filter(isManagerMembership).sort(byName);
  const learning = organizations.filter(isLearnerMembership).sort(byName);

  return { managed, learning };
}

export function findOrgById<TOrg extends Pick<MembershipOrg, 'id'>>(
  organizations: TOrg[],
  orgId: string
): TOrg | undefined {
  return organizations.find((org) => org.id === orgId);
}
