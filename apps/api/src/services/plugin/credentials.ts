import { createHash, randomBytes } from 'crypto';
import { AppError } from '@api/utils/errors';
import {
  createPluginCredential as createPluginCredentialQuery,
  getInstallationById,
  listInstallationCredentials as listInstallationCredentialsQuery,
  recordPluginAuditEvent,
  revokePluginCredential as revokePluginCredentialQuery
} from '@cio/db/queries/plugin';
import type { TPluginCredential } from '@cio/db/types';

function generateCredentialSecret(): string {
  return `cio_sec_${randomBytes(24).toString('base64url')}`;
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export async function createCredential(
  installationId: string,
  label?: string,
  expiresInDays?: number,
  actorProfileId?: string
): Promise<{ credential: TPluginCredential; secret: string }> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  const rawSecret = generateCredentialSecret();
  const secretPrefix = rawSecret.slice(0, 16);
  const secretHash = hashSecret(rawSecret);

  let expiresAt: string | undefined = undefined;
  if (expiresInDays && expiresInDays > 0) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    expiresAt = expiryDate.toISOString();
  }

  const credential = await createPluginCredentialQuery({
    installationId,
    label,
    secretPrefix,
    secretHash,
    expiresAt
  });

  const auditMetadata = { credentialId: credential.id, label };
  await recordPluginAuditEvent({
    installationId,
    organizationId: installation.organizationId,
    actorProfileId,
    action: 'plugin.credential_created',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: auditMetadata
  });

  return {
    credential,
    secret: rawSecret
  };
}

export async function listCredentials(installationId: string): Promise<TPluginCredential[]> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  return listInstallationCredentialsQuery(installationId);
}

export async function revokeCredential(
  installationId: string,
  credentialId: string,
  actorProfileId?: string
): Promise<TPluginCredential> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  const revoked = await revokePluginCredentialQuery(credentialId);
  if (!revoked) {
    throw new AppError('Credential not found', 'CREDENTIAL_NOT_FOUND', 404);
  }

  const auditMetadata = { credentialId };
  await recordPluginAuditEvent({
    installationId,
    organizationId: installation.organizationId,
    actorProfileId,
    action: 'plugin.credential_revoked',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: auditMetadata
  });

  return revoked;
}
