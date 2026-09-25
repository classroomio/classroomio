import {
  CERTIFICATE_PDF_PAGE_OPTIONS,
  CERTIFICATE_VIEWPORT,
  renderCertificate,
  resolveCertificateDesign,
  type CertificateDesign,
  type CertificateRenderData
} from '@cio/certificates';

import { getCloudflarePdfBuffer, getCloudflarePngBuffer } from '@api/utils/cloudflare';
import { fallbackSequence, formatCertificateId, slugifyForFilename } from '@cio/utils/functions';
import { getProfileById } from '@cio/db/queries/auth/profile';

export { resolveCertificateDesign };

export interface CertificateRenderInput {
  design: CertificateDesign;
  data: CertificateRenderData;
}

export interface CertificateRenderFields {
  recipientName: string;
  courseName: string;
  courseDescription: string;
  orgName: string;
  orgLogoUrl?: string;
  studentId?: string;
  issuedAt?: string;
}

/**
 * Shared tail of the course + learning-path certificate render assemblers:
 * formats the issue date, picks the certificate id (`studentId` or a
 * preview fallback sequence) and packs the render input. Callers only
 * resolve the entity-specific fields (design, names, org).
 */
export function buildCertificateRenderInput(
  design: CertificateDesign,
  fields: CertificateRenderFields
): CertificateRenderInput {
  const issuedAtDate = new Date(fields.issuedAt ?? new Date().toISOString());
  const date = Number.isNaN(issuedAtDate.getTime())
    ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
    : issuedAtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const certificateId = fields.studentId
    ? formatCertificateId(design.idFormat, fields.studentId, issuedAtDate)
    : formatCertificateId(design.idFormat, fallbackSequence(issuedAtDate), issuedAtDate);

  return {
    design,
    data: {
      recipientName: fields.recipientName,
      courseName: fields.courseName,
      courseDescription: fields.courseDescription,
      orgName: fields.orgName,
      orgLogoUrl: fields.orgLogoUrl,
      date,
      certificateId
    }
  };
}

/**
 * Shared recipient-name fallback for certificate
 * preview/download flows: an explicit name wins, otherwise the caller's
 * profile name, otherwise a generic preview placeholder.
 */
export async function resolveCertificateRecipientName(userId: string, studentNameOverride?: string): Promise<string> {
  const rawName = studentNameOverride?.trim();

  if (rawName) {
    return rawName;
  }

  const profile = await getProfileById(userId);

  return profile?.fullname || 'Preview Recipient';
}

export async function generateCertificatePdf(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePdfBuffer(html, styles, CERTIFICATE_VIEWPORT, CERTIFICATE_PDF_PAGE_OPTIONS);
}

export async function generateCertificatePng(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePngBuffer(html, styles, { ...CERTIFICATE_VIEWPORT, deviceScaleFactor: 2 });
}

/**
 * Streams a certificate buffer (PDF/PNG) with consistent headers.
 * Dedupes the 4x copy-paste across course + learning-path download routes.
 */
export function sendCertificateFile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  buffer: Uint8Array,
  courseName: string,
  kind: 'pdf' | 'png'
): Response {
  const mime = kind === 'pdf' ? 'application/pdf' : 'image/png';
  const ext = kind;

  c.header('Content-Type', mime);
  c.header('Content-Disposition', `attachment; filename="certificate-${slugifyForFilename(courseName)}.${ext}"`);

  return c.body(
    new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      }
    })
  );
}
