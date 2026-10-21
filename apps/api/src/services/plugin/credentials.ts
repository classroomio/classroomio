import { createHash, randomBytes } from 'crypto';
import { AppError } from '@api/utils/errors';
import {
  createPluginCredential as createPluginCredentialQuery,
  createPluginBackendClient as createPluginBackendClientQuery,
  getActiveBackendClientByClientId as getActiveBackendClientByClientIdQuery,
  getInstallationById,
  getPluginById,
  listInstallationCredentials as listInstallationCredentialsQuery,
  recordPluginAuditEvent,
  revokePluginBackendClient as revokePluginBackendClientQuery,
  revokePluginCredential as revokePluginCredentialQuery,
  rotatePluginBackendClient as rotatePluginBackendClientQuery
} from '@cio/db/queries/plugin';
import type { TPluginBackendClient, TPluginCredential } from '@cio/db/types';
import { requireOrganizationInstallation } from './authorization';

function generateCredentialSecret(): string {
  return `cio_sec_${randomBytes(24).toString('base64url')}`;
}

function generateBackendClientSecret(): string {
  return `cio_bsec_${randomBytes(32).toString('base64url')}`;
}

function generateClientId(pluginId: string): string {
  return `pbc_${pluginId.replace(/[^a-z0-9]/gi, '_')}_${randomBytes(8).toString('hex')}`;
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export async function createCredential(
  installationId: string,
  organizationId: string,
  label?: string,
  expiresInDays?: number,
  actorProfileId?: string
): Promise<{ credential: TPluginCredential; secret: string }> {
  const installation = await requireOrganizationInstallation(installationId, organizationId);

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

export async function listCredentials(installationId: string, organizationId: string): Promise<TPluginCredential[]> {
  await requireOrganizationInstallation(installationId, organizationId);

  return listInstallationCredentialsQuery(installationId);
}

export async function revokeCredential(
  installationId: string,
  organizationId: string,
  credentialId: string,
  actorProfileId?: string
): Promise<TPluginCredential> {
  const installation = await requireOrganizationInstallation(installationId, organizationId);

  const revoked = await revokePluginCredentialQuery(installationId, credentialId);
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

export async function provisionPluginBackendClient(
  pluginId: string,
  label?: string,
  actorProfileId?: string
): Promise<{ client: TPluginBackendClient; secret: string }> {
  const plugin = await getPluginById(pluginId);
  if (!plugin) {
    throw new AppError('Plugin not found', 'PLUGIN_NOT_FOUND', 404);
  }

  const clientId = generateClientId(pluginId);
  const rawSecret = generateBackendClientSecret();
  const secretPrefix = rawSecret.slice(0, 16);
  const secretHash = hashSecret(rawSecret);

  const client = await createPluginBackendClientQuery({
    pluginId,
    clientId,
    label,
    secretPrefix,
    secretHash,
    status: 'active'
  });

  await recordPluginAuditEvent({
    actorProfileId,
    action: 'plugin.backend_client_created',
    resource: pluginId,
    outcome: 'success',
    metadata: { clientId, label }
  });

  return {
    client,
    secret: rawSecret
  };
}

export async function rotatePluginBackendClient(
  clientId: string,
  actorProfileId?: string
): Promise<{ client: TPluginBackendClient; secret: string }> {
  const existing = await getActiveBackendClientByClientIdQuery(clientId);
  if (!existing) {
    throw new AppError('Backend client not found or revoked', 'NOT_FOUND', 404);
  }

  const rawSecret = generateBackendClientSecret();
  const secretPrefix = rawSecret.slice(0, 16);
  const secretHash = hashSecret(rawSecret);

  const client = await rotatePluginBackendClientQuery(existing.id, secretPrefix, secretHash);
  if (!client) {
    throw new AppError('Failed to rotate client secret', 'INTERNAL_ERROR', 500);
  }

  await recordPluginAuditEvent({
    actorProfileId,
    action: 'plugin.backend_client_rotated',
    resource: client.pluginId,
    outcome: 'success',
    metadata: { clientId }
  });

  return {
    client,
    secret: rawSecret
  };
}

export async function revokePluginBackendClientService(
  clientId: string,
  actorProfileId?: string
): Promise<TPluginBackendClient> {
  const existing = await getActiveBackendClientByClientIdQuery(clientId);
  if (!existing) {
    throw new AppError('Backend client not found or already revoked', 'NOT_FOUND', 404);
  }

  const revoked = await revokePluginBackendClientQuery(existing.id);
  if (!revoked) {
    throw new AppError('Failed to revoke backend client', 'INTERNAL_ERROR', 500);
  }

  await recordPluginAuditEvent({
    actorProfileId,
    action: 'plugin.backend_client_revoked',
    resource: revoked.pluginId,
    outcome: 'success',
    metadata: { clientId }
  });

  return revoked;
}
