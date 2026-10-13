import { Hono } from '@api/utils/hono';
import { getPluginOrganizationProfile } from '@api/services/plugin/organization';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import { ZPluginApiOrganizationProfile } from '@cio/utils/validation/plugin';
import { describePluginApiRoute } from '../openapi';

export const pluginApiOrganizationRouter = new Hono().get(
  '/profile',
  describePluginApiRoute({
    operationId: 'pluginOrganizationGetProfile',
    summary: 'Get the current organization profile',
    scope: 'organization.profile:read'
  }),
  async (c) => {
    const claims = c.get('pluginApiClaims')!;
    const requestId = c.get('pluginApiRequestId') as string;

    if (!claims.scopes.includes('organization.profile:read')) {
      return handlePluginApiError(
        c,
        new AppError('Permission organization.profile:read is required', 'FORBIDDEN', 403),
        'Permission denied'
      );
    }

    try {
      const organizationProfile = await getPluginOrganizationProfile(
        claims.installationId,
        claims.organizationId,
        claims.sub
      );
      const profile = ZPluginApiOrganizationProfile.parse({
        id: organizationProfile.id,
        name: organizationProfile.name,
        avatarUrl: organizationProfile.avatarUrl,
        locale: organizationProfile.locale
      });

      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.organization.profile.read',
        resource: claims.organizationId,
        outcome: 'success',
        metadata: { requestId, tokenId: claims.jti }
      });

      return c.json({ success: true as const, data: profile, requestId }, 200);
    } catch (error) {
      await recordPluginAuditEvent({
        installationId: claims.installationId,
        organizationId: claims.organizationId,
        actorProfileId: claims.sub,
        action: 'plugin.api.organization.profile.read',
        resource: claims.organizationId,
        outcome: 'denied',
        metadata: { requestId, tokenId: claims.jti }
      });

      return handlePluginApiError(c, error, 'Failed to read organization profile');
    }
  }
);
