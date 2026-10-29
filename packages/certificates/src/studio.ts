import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from './constants';
import type {
  CertificateDocumentSignatory,
  CertificateDocumentV1,
  CertificateRenderData,
  CertificateRenderResult
} from './types';
import { BASE_STYLES, escapeHtml } from './templates/shared';

export function isCertificateDocumentV1(value: unknown): value is CertificateDocumentV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const candidate = value as Partial<CertificateDocumentV1>;
  return (
    candidate.version === 1 &&
    typeof candidate.accentColor === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.subtitle === 'string' &&
    typeof candidate.idFormat === 'string' &&
    Array.isArray(candidate.signatories)
  );
}

export const isStudioDesign = isCertificateDocumentV1;

function getFont(value: string | undefined, fallback: string): string {
  const fonts: Record<string, string> = {
    serif: 'Georgia, Times New Roman, serif',
    sans: 'Inter, Arial, sans-serif',
    mono: 'Courier New, monospace',
    display: 'Playfair Display, Georgia, serif'
  };
  return fonts[value ?? ''] ?? fallback;
}

function getColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
    ? value
    : fallback;
}

function getDimension(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2000 ? value : null;
}

function getBackground(design: CertificateDocumentV1): string {
  const primary = getColor(design.background?.primaryColor, '#fffdf5');
  const secondary = getColor(design.background?.secondaryColor, '#f6edd3');
  if (design.background?.style === 'solid') return primary;
  if (design.background?.style === 'gradient') return `linear-gradient(135deg, ${primary}, ${secondary})`;
  if (design.background?.style === 'guilloche') {
    return `repeating-radial-gradient(circle at 50% 50%, ${primary}, ${primary} 2px, ${secondary} 3px, ${secondary} 7px)`;
  }
  return `linear-gradient(135deg, ${primary}, ${secondary})`;
}

function getElementStyle(design: CertificateDocumentV1, elementId: string): string {
  const layout = design.elements?.[elementId];
  if (!layout || layout.positionMode !== 'custom') return '';

  const rules = ['position:absolute'];
  const x = getDimension(layout.x);
  const y = getDimension(layout.y);
  const width = getDimension(layout.width);
  const height = getDimension(layout.height);
  if (x !== null) rules.push(`left:${x}px`);
  if (y !== null) rules.push(`top:${y}px`);
  if (width !== null) rules.push(`width:${width}px`);
  if (height !== null) rules.push(`height:${height}px`);
  return rules.join(';');
}

function isEnabled(design: CertificateDocumentV1, elementId: string): boolean {
  return design.elements?.[elementId]?.enabled !== false;
}

function renderSignatory(
  signatory: CertificateDocumentSignatory,
  design: CertificateDocumentV1,
  index: number
): string {
  if (!signatory.enabled) return '';

  const signature = signatory.signatureUrl
    ? `<img class="studio-signature-image" src="${escapeHtml(signatory.signatureUrl)}" alt="">`
    : '<span class="studio-signature-rule"></span>';
  const style = getElementStyle(design, `signatory-${index}`);
  return `<section class="studio-signatory" style="${style}">${signature}<strong>${escapeHtml(signatory.name)}</strong><span>${escapeHtml(signatory.role)}</span></section>`;
}

export function renderCertificateDocumentV1(
  designValue: unknown,
  data: CertificateRenderData
): CertificateRenderResult | null {
  if (!isCertificateDocumentV1(designValue)) return null;

  const design = designValue;
  const textColor = getColor(design.typography?.primaryColor, '#1c1917');
  const accentColor = getColor(design.accentColor, '#1c1917');
  const borderColor = getColor(design.border?.primaryColor, accentColor);
  const configuredBorderWidth = design.border?.width;
  const borderWidth = Math.min(
    64,
    Math.max(
      1,
      typeof configuredBorderWidth === 'number' && Number.isInteger(configuredBorderWidth) ? configuredBorderWidth : 12
    )
  );
  const letterSpacing =
    typeof design.typography?.letterSpacing === 'number' &&
    Number.isFinite(design.typography.letterSpacing) &&
    design.typography.letterSpacing >= 0 &&
    design.typography.letterSpacing <= 1
      ? design.typography.letterSpacing
      : 0.08;
  const title = design.copy?.title ?? design.title;
  const presentation = design.copy?.presentation ?? design.subtitle;
  const completion = design.copy?.completion ?? design.descriptionOverride ?? data.courseDescription;
  const organizationName = design.copy?.organizationName ?? data.orgName;
  const activeSignatories = design.signatories
    .slice(0, 3)
    .map((signatory, index) => renderSignatory(signatory, design, index))
    .join('');
  const badge =
    design.badge?.style && design.badge.style !== 'none'
      ? `<div class="studio-badge">${escapeHtml(design.badge.label ?? 'CERTIFIED')}</div>`
      : '';
  const verification = design.qrCode?.enabled
    ? `<div class="studio-verification">${escapeHtml(design.copy?.verifiedCredentialLabel ?? 'Verified credential')} · ${escapeHtml(data.certificateId)}</div>`
    : `<div class="studio-verification">${escapeHtml(data.certificateId)}</div>`;
  const body = `<main class="studio-certificate">
  <div class="studio-inner">
    ${badge}
    <header class="studio-header" style="${getElementStyle(design, 'header')}">
      <span>${escapeHtml(organizationName)}</span>
      <h1 style="${getElementStyle(design, 'title')}">${escapeHtml(title)}</h1>
    </header>
    <section class="studio-content">
      <p class="studio-presentation" style="${getElementStyle(design, 'subtitle')}">${escapeHtml(presentation)}</p>
      <h2 style="${getElementStyle(design, 'recipient')}">${escapeHtml(data.recipientName)}</h2>
      <p class="studio-course" style="${getElementStyle(design, 'course')}">${escapeHtml(data.courseName)}</p>
      ${isEnabled(design, 'description') ? `<p class="studio-description" style="${getElementStyle(design, 'description')}">${escapeHtml(completion)}</p>` : ''}
    </section>
    <footer class="studio-footer">
      <div class="studio-date" style="${getElementStyle(design, 'date')}">${escapeHtml(design.copy?.dateLabel ?? 'Issued')} ${escapeHtml(data.date)}</div>
      <div class="studio-signatories" style="${getElementStyle(design, 'signatories')}">${activeSignatories}</div>
      ${verification}
    </footer>
  </div>
</main>`;
  const styles = `${BASE_STYLES}
.studio-certificate { width:${CERTIFICATE_WIDTH}px; height:${CERTIFICATE_HEIGHT}px; padding:32px; box-sizing:border-box; background:${getBackground(design)}; color:${textColor}; font-family:${getFont(design.typography?.bodyFont, 'Inter, Arial, sans-serif')}; }
.studio-inner { position:relative; box-sizing:border-box; width:100%; height:100%; padding:54px 68px; overflow:hidden; border:${borderWidth}px solid ${borderColor}; }
.studio-header { text-align:center; letter-spacing:${letterSpacing}em; text-transform:uppercase; }
.studio-header span { font-size:15px; font-weight:700; color:${accentColor}; }
.studio-header h1 { margin:22px 0 0; font-family:${getFont(design.typography?.titleFont, 'Playfair Display, Georgia, serif')}; font-size:54px; line-height:1.05; letter-spacing:normal; text-transform:none; }
.studio-content { display:flex; min-height:340px; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.studio-presentation { margin:0 0 18px; font-size:17px; }
.studio-content h2 { margin:0; font-family:${getFont(design.typography?.recipientFont, 'Playfair Display, Georgia, serif')}; font-size:58px; line-height:1.08; color:${accentColor}; }
.studio-course { margin:22px 0 0; font-size:22px; font-weight:700; }
.studio-description { max-width:660px; margin:18px 0 0; font-size:15px; line-height:1.55; }
.studio-footer { position:relative; display:flex; flex-direction:column; align-items:center; gap:20px; text-align:center; }
.studio-date, .studio-verification { font-size:13px; letter-spacing:0.04em; }
.studio-signatories { display:flex; width:100%; justify-content:space-around; gap:30px; }
.studio-signatory { display:flex; min-width:180px; flex-direction:column; align-items:center; gap:5px; font-size:12px; }
.studio-signatory strong { font-size:14px; }
.studio-signature-image { width:130px; height:34px; object-fit:contain; }
.studio-signature-rule { width:130px; height:34px; border-bottom:1px solid ${textColor}; }
.studio-badge { position:absolute; top:42px; right:42px; display:grid; width:82px; height:82px; place-items:center; border-radius:50%; background:${getColor(design.badge?.foilColor, accentColor)}; color:#fff; font-size:11px; font-weight:800; letter-spacing:0.06em; text-align:center; }
`;

  return { html: body, styles };
}

export const renderStudioCertificate = renderCertificateDocumentV1;

export function getCertificateDocumentIdFormat(designValue: unknown): string | null {
  return isCertificateDocumentV1(designValue) ? designValue.idFormat : null;
}

export const getStudioCertificateIdFormat = getCertificateDocumentIdFormat;
