import { createHash, randomBytes } from 'crypto';
import { AppError } from '@api/utils/errors';
import {
  consumeLaunchCode,
  createLaunchCode as createLaunchCodeQuery,
  getActiveBackendClientByHash,
  getInstallationById,
  getInstallationGrants,
  getPluginCourseById,
  getPluginLessonAccessContext,
  getPluginVersionById,
  getUserOrgRole,
  recordPluginAuditEvent
} from '@cio/db/queries';
import { createPluginApiAccessToken } from './access-token';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface CreateLaunchCodeInput {
  installationId: string;
  userId: string;
  organizationId?: string;
  contributionTarget?: string;
  resource?: {
    type: 'lesson' | 'course' | 'certificate' | 'organization';
    id: string;
  };
  audience?: string;
  handshakeNonce?: string;
}

export interface VerifiedPluginLaunchClaims {
  pluginId: string;
  versionId: string;
  installationId: string;
  organizationId: string;
  userId: string;
  organizationRole: 'admin' | 'tutor' | 'student';
  contributionTarget: 'plugin.page' | 'certificate.templates';
  resource: {
    type: 'lesson' | 'course' | 'certificate' | 'organization';
    id: string;
  } | null;
  audience: string;
  grantedScopes: string[];
  expiresAt: string;
}

export type LaunchClaims = VerifiedPluginLaunchClaims;

export interface PluginLaunchExchangeResult extends VerifiedPluginLaunchClaims {
  accessToken: string;
  tokenType: 'Bearer';
}

function isTargetDeclaredInManifest(manifest: any, target: string): boolean {
  if (!target) return true;
  if (target === 'plugin.page') {
    return Boolean(
      (manifest?.contributes?.pages && manifest.contributes.pages.length > 0) ||
        (manifest?.contributes?.navigation && manifest.contributes.navigation.length > 0)
    );
  }
  if (manifest?.contributes?.pages?.some((p: any) => p.id === target || p.entrypoint === target)) {
    return true;
  }
  if (
    manifest?.contributes?.slots?.some((s: any) => s.target === target || s.id === target || s.entrypoint === target)
  ) {
    return true;
  }
  if (
    manifest?.contributes?.actions?.some((a: any) => a.target === target || a.id === target || a.entrypoint === target)
  ) {
    return true;
  }

  return false;
}

function isAudienceAllowedInManifest(manifest: any, audience: string): boolean {
  if (!audience) return true;
  const backend = manifest?.runtime?.backend;
  if (backend && backend.type === 'remote' && backend.baseUrl) {
    try {
      const expectedOrigin = new URL(backend.baseUrl).origin;
      const requestedOrigin = new URL(audience).origin;
      return expectedOrigin === requestedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}

function mapOrgRole(roleId: number | null): 'admin' | 'tutor' | 'student' | null {
  if (roleId === 1) return 'admin';
  if (roleId === 2) return 'tutor';
  if (roleId === 3) return 'student';

  return null;
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

  if (installation.orgApprovalStatus !== 'approved') {
    throw new AppError('Plugin installation is not approved', 'INSTALLATION_NOT_APPROVED', 403);
  }

  const orgId = input.organizationId ?? installation.organizationId;
  if (!orgId) {
    throw new AppError('Organization context required', 'FORBIDDEN', 403);
  }

  if (installation.organizationId && installation.organizationId !== orgId) {
    throw new AppError('Installation does not belong to organization', 'FORBIDDEN', 403);
  }

  const roleId = await getUserOrgRole(orgId, input.userId);
  if (roleId === null) {
    throw new AppError('User is not an active member of the organization', 'FORBIDDEN', 403);
  }

  const version = await getPluginVersionById(installation.pluginVersionId);
  if (!version) {
    throw new AppError('Plugin version not found', 'NOT_FOUND', 404);
  }

  if (input.contributionTarget && !isTargetDeclaredInManifest(version.manifest, input.contributionTarget)) {
    throw new AppError('Requested contribution target is not declared by installed version', 'FORBIDDEN', 403);
  }

  if (input.audience && !isAudienceAllowedInManifest(version.manifest, input.audience)) {
    throw new AppError('Requested audience does not match manifest backend origin', 'FORBIDDEN', 403);
  }

  if (input.resource?.type === 'organization' && input.resource.id !== orgId) {
    throw new AppError('Launch resource does not belong to organization', 'FORBIDDEN', 403);
  }

  if (input.resource?.type === 'course') {
    const course = await getPluginCourseById(orgId, input.resource.id, input.userId, roleId === 1);
    if (!course) {
      throw new AppError('Launch resource is not accessible to this actor', 'FORBIDDEN', 403);
    }
  }

  if (input.resource?.type === 'lesson') {
    const lesson = await getPluginLessonAccessContext(input.resource.id, orgId);
    if (!lesson) {
      throw new AppError('Launch resource does not belong to organization', 'FORBIDDEN', 403);
    }
    await assertCourseMemberOrOrgAdmin(lesson.courseId, input.userId);
  }

  if (input.contributionTarget === 'certificate.templates' && input.resource?.type !== 'course') {
    throw new AppError('Certificate template launches require a host-bound course', 'FORBIDDEN', 403);
  }

  if (input.contributionTarget === 'lesson.after' && input.resource?.type !== 'lesson') {
    throw new AppError('Lesson launches require a host-bound lesson', 'FORBIDDEN', 403);
  }

  const grants = await getInstallationGrants(installation.id);
  const grantedSet = new Set(grants.map((g) => g.scope));
  const requiredPerms = (version.manifest as any)?.permissions?.required ?? [];
  for (const perm of requiredPerms) {
    if (!grantedSet.has(perm)) {
      throw new AppError('Required permissions not granted', 'FORBIDDEN', 403);
    }
  }

  const rawCode = `lc_sec_${randomBytes(24).toString('base64url')}`;
  const codeHash = hashValue(rawCode);

  const expiryDate = new Date(Date.now() + 60 * 1000);
  const expiresAt = expiryDate.toISOString();

  await createLaunchCodeQuery({
    installationId: input.installationId,
    codeHash,
    userId: input.userId,
    organizationId: orgId,
    contributionTarget: input.contributionTarget,
    resourceType: input.resource?.type,
    resourceId: input.resource?.id,
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
  clientId: string;
}): Promise<PluginLaunchExchangeResult> {
  const clientSecretHash = hashValue(input.clientSecret);
  const backendClient = await getActiveBackendClientByHash(clientSecretHash);

  if (!backendClient || backendClient.clientId !== input.clientId) {
    await recordPluginAuditEvent({
      action: 'plugin.launch_code_exchange_failed',
      outcome: 'denied',
      metadata: { reason: 'invalid_credentials' }
    });
    throw new AppError('Invalid client credentials', 'UNAUTHORIZED', 401);
  }

  const codeHash = hashValue(input.code);
  const consumedCode = await consumeLaunchCode(codeHash);
  if (!consumedCode) {
    await recordPluginAuditEvent({
      action: 'plugin.launch_code_exchange_failed',
      outcome: 'denied',
      metadata: { reason: 'invalid_or_expired_code' }
    });
    throw new AppError('Launch code is invalid, expired, or already used', 'INVALID_LAUNCH_CODE', 400);
  }

  const installation = await getInstallationById(consumedCode.installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.pluginId !== backendClient.pluginId) {
    await recordPluginAuditEvent({
      installationId: installation.id,
      organizationId: installation.organizationId,
      action: 'plugin.launch_code_exchange_failed',
      outcome: 'denied',
      metadata: { reason: 'wrong_plugin' }
    });
    throw new AppError('Launch code does not match client plugin', 'FORBIDDEN', 403);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  if (installation.orgApprovalStatus !== 'approved') {
    throw new AppError('Plugin installation is not approved', 'INSTALLATION_NOT_APPROVED', 403);
  }

  const orgId = consumedCode.organizationId ?? installation.organizationId;
  if (!orgId) {
    throw new AppError('Organization context required', 'FORBIDDEN', 403);
  }

  if (installation.organizationId && installation.organizationId !== orgId) {
    throw new AppError('Installation does not belong to organization', 'FORBIDDEN', 403);
  }

  const roleId = await getUserOrgRole(orgId, consumedCode.userId);
  if (roleId === null) {
    throw new AppError('User is not an active member of the organization', 'FORBIDDEN', 403);
  }

  const organizationRole = mapOrgRole(roleId);
  if (!organizationRole) {
    throw new AppError('Insufficient organization role', 'FORBIDDEN', 403);
  }

  const version = await getPluginVersionById(installation.pluginVersionId);
  if (!version) {
    throw new AppError('Plugin version not found', 'NOT_FOUND', 404);
  }

  if (
    consumedCode.contributionTarget &&
    !isTargetDeclaredInManifest(version.manifest, consumedCode.contributionTarget)
  ) {
    throw new AppError('Requested contribution target is not declared by installed version', 'FORBIDDEN', 403);
  }

  if (consumedCode.audience && !isAudienceAllowedInManifest(version.manifest, consumedCode.audience)) {
    throw new AppError('Requested audience does not match manifest backend origin', 'FORBIDDEN', 403);
  }

  const grants = await getInstallationGrants(installation.id);
  const grantedScopes = grants.map((g) => g.scope);
  const grantedSet = new Set(grantedScopes);
  const requiredPerms = (version.manifest as any)?.permissions?.required ?? [];
  for (const perm of requiredPerms) {
    if (!grantedSet.has(perm)) {
      throw new AppError('Required permissions not granted', 'FORBIDDEN', 403);
    }
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await recordPluginAuditEvent({
    installationId: installation.id,
    organizationId: orgId,
    actorProfileId: consumedCode.userId,
    action: 'plugin.launch_code_exchanged',
    resource: installation.pluginId,
    outcome: 'success',
    metadata: {
      contributionTarget: consumedCode.contributionTarget,
      audience: consumedCode.audience
    }
  });

  const launchClaims: VerifiedPluginLaunchClaims = {
    pluginId: installation.pluginId,
    versionId: installation.pluginVersionId,
    installationId: consumedCode.installationId,
    organizationId: orgId,
    userId: consumedCode.userId,
    organizationRole,
    contributionTarget: (consumedCode.contributionTarget ?? 'plugin.page') as 'plugin.page' | 'certificate.templates',
    resource:
      consumedCode.resourceType && consumedCode.resourceId
        ? {
            type: consumedCode.resourceType as 'lesson' | 'course' | 'certificate' | 'organization',
            id: consumedCode.resourceId
          }
        : null,
    audience:
      consumedCode.audience ??
      ((version.manifest as any)?.runtime?.backend?.type === 'remote'
        ? (version.manifest as any)?.runtime?.backend?.baseUrl
        : ''),
    grantedScopes,
    expiresAt
  };
  const pluginApiToken = createPluginApiAccessToken(launchClaims);

  return {
    ...launchClaims,
    accessToken: pluginApiToken.accessToken,
    tokenType: 'Bearer',
    expiresAt: pluginApiToken.expiresAt
  };
}
