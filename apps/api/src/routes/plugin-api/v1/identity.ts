import { Hono } from '@api/utils/hono';
import { getPluginIdentityProfile } from '@api/services/plugin/identity';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { ZPluginApiIdentityProfile } from '@cio/utils/validation/plugin';
import { describePluginApiRoute } from '../openapi';

export const pluginApiIdentityRouter = new Hono().get(
  '/profile',
  describePluginApiRoute({
    operationId: 'pluginIdentityGetProfile',
    summary: 'Get the current actor identity profile',
    scope: 'identity.profile:read'
  }),
  async (c) => {
    const claims = c.get('pluginApiClaims')!;
    const requestId = c.get('pluginApiRequestId') as string;

    if (!claims.scopes.includes('identity.profile:read')) {
      return handlePluginApiError(
        c,
        new AppError('Permission identity.profile:read is required', 'FORBIDDEN', 403),
        'Permission denied'
      );
    }

    try {
      const identityProfile = await getPluginIdentityProfile(claims.installationId, claims.organizationId, claims.sub);
      const profile = ZPluginApiIdentityProfile.parse({
        id: identityProfile.id,
        displayName: identityProfile.displayName,
        avatarUrl: identityProfile.avatarUrl,
        locale: identityProfile.locale,
        role: identityProfile.role
      });

      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.identity.profile.read',
        resource: claims.sub,
        outcome: 'success',
        metadata: { requestId, tokenId: claims.jti }
      });

      return c.json({ success: true as const, data: profile, requestId }, 200);
    } catch (error) {
      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.identity.profile.read',
        resource: claims.sub,
        outcome: 'denied',
        metadata: { requestId, tokenId: claims.jti }
      });

      return handlePluginApiError(c, error, 'Failed to fetch identity profile');
    }
  }
);
