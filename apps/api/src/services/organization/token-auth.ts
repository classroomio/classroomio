import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createTokenAuth,
  deleteTokenAuth,
  getTokenAuthByOrgId,
  updateTokenAuth
} from '@cio/db/queries/organization/token-auth';
import { getOrganizationPlanStatus } from '@cio/db/queries/organization/organization';
import type { TOrganizationTokenAuth } from '@db/types';
import { randomBytes } from 'crypto';

async function assertEnterprisePlan(orgId: string): Promise<void> {
  const plans = await getOrganizationPlanStatus(orgId);
  const hasEnterprise = plans.some(
    (p: { planName: string | null; isActive: boolean | null }) => p.planName === 'ENTERPRISE' && p.isActive
  );

  if (!hasEnterprise) {
    throw new AppError('Token auth requires Enterprise plan', ErrorCodes.UPGRADE_REQUIRED, 403);
  }
}

function generateSigningSecret(): string {
  return randomBytes(32).toString('hex');
}

export interface TokenAuthStatus {
  isActive: boolean;
  createdAt: string;
  secretLast4: string | null;
}

export async function getTokenAuthStatus(orgId: string): Promise<TokenAuthStatus | null> {
  const row = await getTokenAuthByOrgId(orgId);
  if (!row) return null;

  const secretLast4 = row.signingSecret.length >= 4 ? row.signingSecret.slice(-4) : null;

  return {
    isActive: row.isActive,
    createdAt: row.createdAt,
    secretLast4
  };
}

export async function createTokenAuthConfig(
  orgId: string,
  createdByProfileId: string
): Promise<{ secret: string; config: TOrganizationTokenAuth }> {
  await assertEnterprisePlan(orgId);

  const existing = await getTokenAuthByOrgId(orgId);
  if (existing) {
    throw new AppError('Organization already has token auth configured', ErrorCodes.TOKEN_AUTH_ALREADY_EXISTS, 409);
  }

  const secret = generateSigningSecret();
  const config = await createTokenAuth({
    organizationId: orgId,
    signingSecret: secret,
    isActive: false,
    createdByProfileId
  });

  return { secret, config };
}

export async function rotateTokenAuthSecret(orgId: string): Promise<{ secret: string }> {
  const existing = await getTokenAuthByOrgId(orgId);
  if (!existing) {
    throw new AppError('Token auth not found', ErrorCodes.NOT_FOUND, 404);
  }

  const secret = generateSigningSecret();
  await updateTokenAuth(orgId, { signingSecret: secret });
  return { secret };
}

export async function deleteTokenAuthConfig(orgId: string): Promise<void> {
  const existing = await getTokenAuthByOrgId(orgId);
  if (!existing) {
    throw new AppError('Token auth not found', ErrorCodes.NOT_FOUND, 404);
  }

  await deleteTokenAuth(orgId);
}

export async function activateTokenAuth(orgId: string, isActive: boolean): Promise<TOrganizationTokenAuth | null> {
  const existing = await getTokenAuthByOrgId(orgId);
  if (!existing) {
    throw new AppError('Token auth not found', ErrorCodes.NOT_FOUND, 404);
  }

  return updateTokenAuth(orgId, { isActive });
}
