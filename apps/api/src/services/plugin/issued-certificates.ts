import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { assertCourseMemberOrOrgAdmin } from '@api/services/v1/shared';
import { getPluginIssuedCertificateById, getPluginIssuedCertificatesList } from '@cio/db/queries';
import { type TPluginApiIssuedCertificate, ZPluginApiIssuedCertificate } from '@cio/utils/validation/plugin';

export async function listIssuedCertificatesForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  options?: { limit?: number; cursor?: string; courseId?: string }
): Promise<{ items: TPluginApiIssuedCertificate[]; nextCursor: string | null }> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.issued:read'
  });

  if (options?.courseId) {
    await assertCourseMemberOrOrgAdmin(options.courseId, actorId);
  }

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const result = await getPluginIssuedCertificatesList(organizationId, options?.courseId, actorId, canReadAll, options);

  const items = result.items.map((item) => ZPluginApiIssuedCertificate.parse(item));

  return { items, nextCursor: result.nextCursor };
}

export async function getIssuedCertificateForPlugin(
  installationId: string,
  organizationId: string,
  actorId: string,
  certificateId: string
): Promise<TPluginApiIssuedCertificate> {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId,
    requiredScope: 'certificate.issued:read'
  });

  const canReadAll = authorization.organizationRole === 'admin' || authorization.organizationRole === 'tutor';
  const item = await getPluginIssuedCertificateById(organizationId, certificateId, actorId, canReadAll);

  if (!item) {
    throw new AppError('Certificate not found', 'CERTIFICATE_NOT_FOUND', 404);
  }

  return ZPluginApiIssuedCertificate.parse(item);
}
