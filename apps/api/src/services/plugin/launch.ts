import { createHash, randomBytes } from 'crypto';
import { AppError } from '@api/utils/errors';
import {
  consumeLaunchCode,
  createLaunchCode as createLaunchCodeQuery,
  getActiveCredentialByHash,
  getInstallationById
} from '@cio/db/queries/plugin';

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface CreateLaunchCodeInput {
  installationId: string;
  userId: string;
  organizationId?: string;
  contributionTarget?: string;
  audience?: string;
  handshakeNonce?: string;
}

export interface LaunchClaims {
  installationId: string;
  pluginId: string;
  versionId: string;
  organizationId: string | null;
  userId: string;
  contributionTarget: string | null;
  audience: string | null;
}

export async function createLaunchCodeForSession(input: CreateLaunchCodeInput): Promise<{
  code: string;
  expiresInSeconds: number;
}> {
  const installation = await getInstallationById(input.installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const rawCode = `lc_sec_${randomBytes(24).toString('base64url')}`;
  const codeHash = hashValue(rawCode);

  const expiryDate = new Date(Date.now() + 60 * 1000);
  const expiresAt = expiryDate.toISOString();

  await createLaunchCodeQuery({
    installationId: input.installationId,
    codeHash,
    userId: input.userId,
    organizationId: input.organizationId,
    contributionTarget: input.contributionTarget,
    audience: input.audience,
    handshakeNonce: input.handshakeNonce,
    expiresAt
  });

  return {
    code: rawCode,
    expiresInSeconds: 60
  };
}

export async function exchangeLaunchCodeForClaims(input: {
  code: string;
  clientSecret: string;
}): Promise<LaunchClaims> {
  const clientSecretHash = hashValue(input.clientSecret);
  const credential = await getActiveCredentialByHash(clientSecretHash);
  if (!credential) {
    throw new AppError('Invalid client credentials', 'UNAUTHORIZED', 401);
  }

  const codeHash = hashValue(input.code);
  const consumedCode = await consumeLaunchCode(codeHash);
  if (!consumedCode) {
    throw new AppError('Launch code is invalid, expired, or already used', 'INVALID_LAUNCH_CODE', 400);
  }

  if (consumedCode.installationId !== credential.installationId) {
    throw new AppError('Launch code does not match credential installation', 'UNAUTHORIZED', 403);
  }

  const installation = await getInstallationById(consumedCode.installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  return {
    installationId: consumedCode.installationId,
    pluginId: installation.pluginId,
    versionId: installation.pluginVersionId,
    organizationId: consumedCode.organizationId,
    userId: consumedCode.userId,
    contributionTarget: consumedCode.contributionTarget,
    audience: consumedCode.audience
  };
}
