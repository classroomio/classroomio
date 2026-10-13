import { Hono } from '@api/utils/hono';
import {
  getIssuedCertificateForPlugin,
  listIssuedCertificatesForPlugin
} from '@api/services/plugin/issued-certificates';
import { listAvailableCertificateTemplatesForPlugin } from '@api/services/plugin/templates';
import { recordPluginAuditEvent } from '@cio/db/queries';
import { handlePluginApiError } from '../errors';
import { AppError } from '@api/utils/errors';
import {
  ZPluginApiCertificateTemplate,
  ZPluginApiCursorPage,
  ZPluginApiIssuedCertificate,
  ZPluginApiListQuery
} from '@cio/utils/validation/plugin';
import { z } from 'zod';
import { describePluginApiRoute } from '../openapi';

const ZIssuedCertificatesQuery = ZPluginApiListQuery.extend({
  courseId: z.string().uuid().optional()
});

export const pluginApiCertificatesRouter = new Hono()
  .get(
    '/templates',
    describePluginApiRoute({
      operationId: 'pluginCertificateTemplatesList',
      summary: 'List available certificate templates',
      scope: 'certificate.template:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;

      if (!claims.scopes.includes('certificate.template:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission certificate.template:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const templates = await listAvailableCertificateTemplatesForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub
        );
        const data = z.array(ZPluginApiCertificateTemplate).parse(templates);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.template.list',
          resource: claims.organizationId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.template.list',
          resource: claims.organizationId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list certificate templates');
      }
    }
  )
  .get(
    '/issued',
    describePluginApiRoute({
      operationId: 'pluginIssuedCertificatesList',
      summary: 'List issued certificates visible to the current actor',
      scope: 'certificate.issued:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;

      if (!claims.scopes.includes('certificate.issued:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission certificate.issued:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const queryResult = ZIssuedCertificatesQuery.safeParse(c.req.query());
        if (!queryResult.success) {
          throw new AppError('Invalid query parameters', 'VALIDATION_ERROR', 400);
        }

        const listResult = await listIssuedCertificatesForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          queryResult.data
        );
        const data = ZPluginApiCursorPage(ZPluginApiIssuedCertificate).parse(listResult);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.issued.list',
          resource: queryResult.data.courseId ?? claims.organizationId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.issued.list',
          resource: claims.organizationId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to list issued certificates');
      }
    }
  )
  .get(
    '/issued/:certificateId',
    describePluginApiRoute({
      operationId: 'pluginIssuedCertificatesGet',
      summary: 'Get issued certificate by ID',
      scope: 'certificate.issued:read'
    }),
    async (c) => {
      const claims = c.get('pluginApiClaims')!;
      const requestId = c.get('pluginApiRequestId') as string;
      const certificateId = c.req.param('certificateId');

      if (!claims.scopes.includes('certificate.issued:read')) {
        return handlePluginApiError(
          c,
          new AppError('Permission certificate.issued:read is required', 'FORBIDDEN', 403),
          'Permission denied'
        );
      }

      try {
        const cert = await getIssuedCertificateForPlugin(
          claims.installationId,
          claims.organizationId,
          claims.sub,
          certificateId
        );
        const data = ZPluginApiIssuedCertificate.parse(cert);

        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.issued.get',
          resource: certificateId,
          outcome: 'success',
          metadata: { requestId, tokenId: claims.jti }
        });

        return c.json({ success: true as const, data, requestId }, 200);
      } catch (error) {
        await recordPluginAuditEvent({
          installationId: claims.installationId,
          organizationId: claims.organizationId,
          actorProfileId: claims.sub,
          action: 'plugin.api.certificate.issued.get',
          resource: certificateId,
          outcome: 'denied',
          metadata: { requestId, tokenId: claims.jti }
        });

        return handlePluginApiError(c, error, 'Failed to read issued certificate');
      }
    }
  );
