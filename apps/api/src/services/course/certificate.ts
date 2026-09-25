import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseById, getOrganizationById, getCourseOrganizationId } from '@cio/db/queries';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  buildCertificateRenderInput,
  resolveCertificateDesign,
  resolveCertificateRecipientName,
  type CertificateRenderInput
} from '@api/utils/certificate';
import type { TCertificateDownloadRequest } from '@cio/utils/validation/course';

/**
 * Throws unless the caller can preview certificate designs.
 * Keeps direct DB access out of routes (AGENTS.md Step 2/3).
 */
export async function assertCertificatePreviewAllowed(courseId: string, userId: string): Promise<void> {
  const isTeam = await isCourseTeamMemberOrOrgAdmin(courseId, userId);

  if (!isTeam) {
    throw new AppError('Only course team members can preview certificate designs', ErrorCodes.UNAUTHORIZED, 403);
  }
}

/**
 * Loads the design + render data for a given course/student pair so the API
 * can hand it to `generateCertificatePdf` / `generateCertificatePng`.
 *
 * The client only sends `studentName` (+ optional studentId/issuedAt). Everything
 * else comes from the database: title, description, org name + logo, design.
 */
export async function assembleCertificateRender(
  courseId: string,
  body: TCertificateDownloadRequest,
  dbClient?: DbOrTxClient
): Promise<CertificateRenderInput> {
  const courseRows = await getCourseById(courseId, dbClient);
  const courseRow = courseRows[0];

  if (!courseRow) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const organizationId = await getCourseOrganizationId(courseId, dbClient);
  const organization = organizationId ? await getOrganizationById(organizationId, dbClient) : null;

  const design = resolveCertificateDesign(courseRow.certificate);

  return buildCertificateRenderInput(design, {
    recipientName: body.studentName,
    courseName: courseRow.title,
    courseDescription: courseRow.description ?? '',
    orgName: organization?.name ?? '',
    orgLogoUrl: organization?.avatarUrl ?? undefined,
    studentId: body.studentId,
    issuedAt: body.issuedAt
  });
}

export async function assembleOwnerPreviewRender(
  courseId: string,
  userId: string,
  body: TCertificateDownloadRequest,
  dbClient?: DbOrTxClient
): Promise<CertificateRenderInput> {
  const studentName = await resolveCertificateRecipientName(userId, body.studentName);

  return assembleCertificateRender(courseId, { ...body, studentName }, dbClient);
}
