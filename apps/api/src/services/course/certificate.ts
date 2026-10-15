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
 * The recipient name is an explicit argument, never read from the request
 * body here: student download passes the profile-resolved name, owner
 * preview passes its gated sample name. Everything else comes from the
 * database: title, description, org name + logo, design.
 */
async function buildCourseCertificateRender(
  courseId: string,
  recipientName: string,
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
    recipientName,
    courseName: courseRow.title,
    courseDescription: courseRow.description ?? '',
    orgName: organization?.name ?? '',
    orgLogoUrl: organization?.avatarUrl ?? undefined,
    studentId: body.studentId,
    issuedAt: body.issuedAt
  });
}

/**
 * Student download render. The recipient name always resolves from the
 * authenticated student's profile.
 */
export async function assembleCertificateRender(
  courseId: string,
  body: TCertificateDownloadRequest,
  dbClient: DbOrTxClient | undefined,
  studentUserId: string
): Promise<CertificateRenderInput> {
  const recipientName = await resolveCertificateRecipientName(studentUserId);

  return buildCourseCertificateRender(courseId, recipientName, body, dbClient);
}

export async function assembleOwnerPreviewRender(
  courseId: string,
  userId: string,
  body: TCertificateDownloadRequest,
  dbClient?: DbOrTxClient
): Promise<CertificateRenderInput> {
  const previewName = body.studentName.trim() || (await resolveCertificateRecipientName(userId));

  return buildCourseCertificateRender(courseId, previewName, body, dbClient);
}
