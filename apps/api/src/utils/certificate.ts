import {
  CERTIFICATE_PDF_PAGE_OPTIONS,
  CERTIFICATE_VIEWPORT,
  getCertificateDocumentIdFormat,
  getStudioCertificateIdFormat,
  renderCertificate,
  renderCertificatePresentation,
  renderStudioCertificate,
  resolveCertificateDesign,
  type CertificateDesign,
  type CertificatePresentationV1,
  type CertificateRenderData
} from '@cio/certificates';

import { getCloudflarePdfBuffer, getCloudflarePngBuffer } from '@api/utils/cloudflare';

export { getCertificateDocumentIdFormat, getStudioCertificateIdFormat, resolveCertificateDesign };

export interface CertificateRenderInput {
  design: CertificateDesign;
  presentation?: CertificatePresentationV1 | null;
  studioDesign?: Record<string, unknown> | null;
  data: CertificateRenderData;
}

export async function generateCertificatePdf(input: CertificateRenderInput) {
  const rendered = input.presentation
    ? renderCertificatePresentation(input.presentation, input.data)
    : ((input.studioDesign ? renderStudioCertificate(input.studioDesign, input.data) : null) ??
      renderCertificate(input.design, input.data));
  const { html, styles } = rendered;

  return getCloudflarePdfBuffer(html, styles, CERTIFICATE_VIEWPORT, CERTIFICATE_PDF_PAGE_OPTIONS);
}

export async function generateCertificatePng(input: CertificateRenderInput) {
  const rendered = input.presentation
    ? renderCertificatePresentation(input.presentation, input.data)
    : ((input.studioDesign ? renderStudioCertificate(input.studioDesign, input.data) : null) ??
      renderCertificate(input.design, input.data));
  const { html, styles } = rendered;

  return getCloudflarePngBuffer(html, styles, { ...CERTIFICATE_VIEWPORT, deviceScaleFactor: 2 });
}

export function slugifyForFilename(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'certificate'
  );
}
