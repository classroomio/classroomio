import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countWorkspacesForAccount,
  createSecondaryWorkspace,
  deleteSecondaryWorkspace,
  getAccountPrimary,
  getActivePlanForPrimary,
  listWorkspacesForAccount
} from '@cio/db/queries/account';
import { canCreateWorkspaces, getWorkspaceAllowance } from '@cio/utils/plans';

import { ROLE } from '@cio/utils/constants';
import type { TOrganization } from '@cio/db/types';
import { checkSiteNameExists } from '@cio/db/queries/organization';

export type AccountWorkspace = TOrganization & {
  isPrimary: boolean;
};

async function resolvePrimaryOrThrow(activeOrgId: string): Promise<TOrganization> {
  const primary = await getAccountPrimary(activeOrgId);
  if (!primary) {
    throw new AppError('Active organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  if (primary.id !== activeOrgId) {
    throw new AppError(
      'Account workspace operations must be performed from the primary workspace',
      ErrorCodes.NOT_PRIMARY_WORKSPACE,
      403
    );
  }

  return primary;
}

export async function listAccountWorkspaces(activeOrgId: string): Promise<AccountWorkspace[]> {
  const primary = await resolvePrimaryOrThrow(activeOrgId);
  const rows = await listWorkspacesForAccount(primary.id);

  return rows.map((row) => ({
    ...row,
    isPrimary: row.parentOrganizationId === null
  }));
}

export async function createWorkspaceForAccount(
  activeOrgId: string,
  ownerProfileId: string,
  input: { name: string; siteName: string }
): Promise<AccountWorkspace> {
  const primary = await resolvePrimaryOrThrow(activeOrgId);
  const planName = await getActivePlanForPrimary(primary.id);

  if (!canCreateWorkspaces(planName)) {
    throw new AppError('Multi-workspace requires the Enterprise plan', ErrorCodes.PLAN_UPGRADE_REQUIRED, 402);
  }

  const allowance = getWorkspaceAllowance(planName);
  const current = await countWorkspacesForAccount(primary.id);
  if (current >= allowance) {
    throw new AppError(
      `Workspace limit reached (${allowance} per Enterprise account)`,
      ErrorCodes.WORKSPACE_LIMIT_REACHED,
      409
    );
  }

  const exists = await checkSiteNameExists(input.siteName);
  if (exists) {
    throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
  }

  try {
    const created = await createSecondaryWorkspace({
      parentOrganizationId: primary.id,
      name: input.name,
      siteName: input.siteName,
      ownerProfileId,
      ownerRoleId: ROLE.ADMIN
    });

    return { ...created, isPrimary: false };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: unknown }).code === '23505') {
      throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
    }
    throw new AppError(error instanceof Error ? error : new Error('Unknown error'), ErrorCodes.ORG_CREATE_FAILED, 500);
  }
}

export async function deleteWorkspaceFromAccount(activeOrgId: string, targetWorkspaceId: string): Promise<void> {
  const primary = await resolvePrimaryOrThrow(activeOrgId);

  const workspaces = await listWorkspacesForAccount(primary.id);
  const target = workspaces.find((row) => row.id === targetWorkspaceId);
  if (!target) {
    throw new AppError('Workspace not found in account', ErrorCodes.WORKSPACE_NOT_FOUND, 404);
  }

  if (!target.parentOrganizationId) {
    throw new AppError('Cannot delete the primary workspace', ErrorCodes.WORKSPACE_IS_PRIMARY, 400);
  }

  const result = await deleteSecondaryWorkspace(targetWorkspaceId);
  if (!result.deleted) {
    if (result.reason === 'IS_PRIMARY') {
      throw new AppError('Cannot delete the primary workspace', ErrorCodes.WORKSPACE_IS_PRIMARY, 400);
    }
    throw new AppError('Workspace not found', ErrorCodes.WORKSPACE_NOT_FOUND, 404);
  }
}

export async function getWorkspaceLimits(activeOrgId: string) {
  const primary = await resolvePrimaryOrThrow(activeOrgId);
  const planName = await getActivePlanForPrimary(primary.id);
  const used = await countWorkspacesForAccount(primary.id);
  const allowance = getWorkspaceAllowance(planName);

  return {
    planName,
    canCreate: canCreateWorkspaces(planName) && used < allowance,
    used,
    allowance,
    requiresUpgrade: !canCreateWorkspaces(planName)
  };
}
