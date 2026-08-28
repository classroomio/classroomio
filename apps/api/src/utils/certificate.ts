import {
  DEFAULT_CERTIFICATE_DESIGN,
  renderCertificate,
  resolveTemplateId,
  type CertificateDesign,
  type CertificateRenderData
} from '@cio/certificates';

import {
  getCloudflarePdfBuffer,
  getCloudflarePngBuffer,
  type PdfPageOptions,
  type RenderViewport
} from '@api/utils/cloudflare';

const CERTIFICATE_VIEWPORT: RenderViewport = { width: 1100, height: 780 };

const CERTIFICATE_PDF_OPTIONS: PdfPageOptions = {
  width: '1100px',
  height: '780px',
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
};

export interface CertificateRenderInput {
  design: CertificateDesign;
  data: CertificateRenderData;
}

/**
 * Coerces a stored `course.certificate` JSONB blob (legacy or current) into a
 * complete `CertificateDesign` suitable for `renderCertificate`.
 */
export function resolveCertificateDesign(stored: unknown): CertificateDesign {
  const blob = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const legacyTheme = typeof blob.theme === 'string' ? (blob.theme as string) : undefined;
  const storedDesign =
    blob.design && typeof blob.design === 'object' ? (blob.design as Partial<CertificateDesign>) : undefined;

  const templateId = resolveTemplateId(storedDesign?.templateId ?? legacyTheme);

  const accentColor =
    storedDesign?.accentColor && /^#[0-9a-fA-F]{6}$/.test(storedDesign.accentColor)
      ? storedDesign.accentColor
      : DEFAULT_CERTIFICATE_DESIGN.accentColor;

  const storedSignatories = Array.isArray(storedDesign?.signatories) ? storedDesign?.signatories : undefined;

  const signatories: CertificateDesign['signatories'] = [
    {
      name: storedSignatories?.[0]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].name,
      role: storedSignatories?.[0]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].role,
      enabled: storedSignatories?.[0]?.enabled ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].enabled,
      signatureUrl: storedSignatories?.[0]?.signatureUrl
    },
    {
      name: storedSignatories?.[1]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].name,
      role: storedSignatories?.[1]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].role,
      enabled: storedSignatories?.[1]?.enabled ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].enabled,
      signatureUrl: storedSignatories?.[1]?.signatureUrl
    }
  ];

  return {
    templateId,
    accentColor,
    subtitle: storedDesign?.subtitle ?? DEFAULT_CERTIFICATE_DESIGN.subtitle,
    descriptionOverride: storedDesign?.descriptionOverride,
    signatories,
    idFormat: storedDesign?.idFormat ?? DEFAULT_CERTIFICATE_DESIGN.idFormat
  };
}

export async function generateCertificatePdf(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePdfBuffer(html, styles, CERTIFICATE_VIEWPORT, CERTIFICATE_PDF_OPTIONS);
}

export async function generateCertificatePng(input: CertificateRenderInput) {
  const { html, styles } = renderCertificate(input.design, input.data);

  return getCloudflarePngBuffer(html, styles, { ...CERTIFICATE_VIEWPORT, deviceScaleFactor: 2 });
}
