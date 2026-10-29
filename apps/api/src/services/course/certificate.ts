import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseById, getOrganizationById, getProfileById, getCourseOrganizationId } from '@cio/db/queries';
import {
  getCertificateDocumentIdFormat,
  getStudioCertificateIdFormat,
  resolveCertificateDesign,
  type CertificateRenderInput
} from '@api/utils/certificate';
import type { CertificatePresentationV1 } from '@cio/certificates';
import type { TCertificateDownloadRequest } from '@cio/utils/validation/course';

/**
 * Loads the design + render data for a given course/student pair so the API
 * can hand it to `generateCertificatePdf` / `generateCertificatePng`.
 *
 * The client only sends `studentName` (+ optional studentId/issuedAt). Everything
 * else comes from the database: title, description, org name + logo, design.
 */
export async function assembleCertificateRender(
  courseId: string,
  body: TCertificateDownloadRequest
): Promise<CertificateRenderInput> {
  const [courseRow] = await getCourseById(courseId);
  if (!courseRow) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const organizationId = await getCourseOrganizationId(courseId);
  const organization = organizationId ? await getOrganizationById(organizationId) : null;

  const design = resolveCertificateDesign(courseRow.certificate);

  const issuedAtIso = body.issuedAt ?? new Date().toISOString();
  const issuedAtDate = new Date(issuedAtIso);
  const date = Number.isNaN(issuedAtDate.getTime())
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
    : issuedAtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const presentation = courseRow.certificate?.presentation;
  const customDocument = courseRow.certificate?.customDocument ?? courseRow.certificate?.studioDesign;

  let activePresentation: CertificatePresentationV1;
  if (presentation && typeof presentation === 'object' && 'kind' in presentation) {
    activePresentation = presentation as CertificatePresentationV1;
  } else if (customDocument && typeof customDocument === 'object') {
    activePresentation = {
      kind: 'document',
      schema: 'classroomio.certificate-document',
      version: 1,
      document: customDocument as any
    };
  } else {
    activePresentation = {
      kind: 'preset',
      presetId: design.templateId,
      overrides: design
    };
  }

  const documentIdFormat =
    activePresentation.kind === 'document' ? getCertificateDocumentIdFormat(activePresentation.document) : null;
  const idFormat = documentIdFormat ?? design.idFormat;
  const certificateId = body.studentId
    ? formatCertificateId(idFormat, body.studentId, issuedAtDate)
    : formatCertificateId(idFormat, fallbackSequence(issuedAtDate), issuedAtDate);

  return {
    design,
    presentation: activePresentation,
    studioDesign: null,
    data: {
      recipientName: body.studentName,
      courseName: courseRow.title,
      courseDescription: courseRow.description ?? '',
      orgName: organization?.name ?? '',
      orgLogoUrl: organization?.avatarUrl ?? undefined,
      date,
      certificateId
    }
  };
}

function formatCertificateId(format: string | undefined, seq: string, issuedAt: Date): string {
  const year = issuedAt.getFullYear();
  const month = String(issuedAt.getMonth() + 1).padStart(2, '0');
  const tail = seq.replace(/-/g, '').slice(-4).toUpperCase() || '0001';

  return (format ?? 'N° {seq}').replace('{seq}', tail).replace('{year}', String(year)).replace('{month}', month);
}

function fallbackSequence(issuedAt: Date): string {
  return String(issuedAt.getTime()).slice(-6);
}

export async function assembleOwnerPreviewRender(
  courseId: string,
  userId: string,
  body: TCertificateDownloadRequest
): Promise<CertificateRenderInput> {
  const studentName = body.studentName.trim().length
    ? body.studentName
    : (await getProfileById(userId))?.fullname || 'Preview Recipient';

  return assembleCertificateRender(courseId, { ...body, studentName });
}
