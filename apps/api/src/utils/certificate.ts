import {
  CERTIFICATE_PDF_PAGE_OPTIONS,
  CERTIFICATE_VIEWPORT,
  renderCertificate,
  resolveCertificateDesign,
  type CertificateDesign,
  type CertificateRenderData
} from '@cio/certificates';

import { getCloudflarePdfBuffer, getCloudflarePngBuffer } from '@api/utils/cloudflare';

export { resolveCertificateDesign };

export interface CertificateRenderInput {
  design: CertificateDesign;
  data: CertificateRenderData;
}

export async function generateCertificatePdf(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePdfBuffer(html, styles, CERTIFICATE_VIEWPORT, CERTIFICATE_PDF_PAGE_OPTIONS);
}

export async function generateCertificatePng(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePngBuffer(html, styles, { ...CERTIFICATE_VIEWPORT, deviceScaleFactor: 2 });
}
