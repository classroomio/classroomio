import {
  clearSecondariesReadOnly,
  findAccountsOverAllowance,
  setSecondariesReadOnlyUntil
} from '@cio/db/queries/account';

import { WORKSPACES_INCLUDED } from '@cio/utils/plans';

const GRACE_PERIOD_DAYS = 7;

export type GraceCheckResult = {
  scanned: number;
  marked: Array<{ primaryOrgId: string; planName: string | null; workspaceCount: number; secondariesAffected: number }>;
};

/**
 * Daily check: any account whose total workspace count exceeds the allowance
 * for its current plan gets all of its secondary workspaces marked read-only
 * for the next 7 days. The primary workspace is never locked.
 */
export async function runWorkspaceGraceCheck(): Promise<GraceCheckResult> {
  const offenders = await findAccountsOverAllowance(WORKSPACES_INCLUDED);
  const until = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const marked: GraceCheckResult['marked'] = [];

  for (const offender of offenders) {
    const affected = await setSecondariesReadOnlyUntil(offender.primaryOrgId, until);
    marked.push({ ...offender, secondariesAffected: affected });
  }

  return { scanned: offenders.length, marked };
}

export async function clearWorkspaceGraceForAccount(primaryOrgId: string): Promise<number> {
  return clearSecondariesReadOnly(primaryOrgId);
}
