import type { CertificateDesign, CertificateRenderData, CertificateSignatory } from '../types';
import { computeFieldFontSizes, type FitFontSizeOptions } from '../font-metrics';

export function escapeHtml(input: unknown): string {
  return String(input ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function getYear(value: string | undefined | null): string {
  const match = String(value ?? '').match(/\b(19|20|21)\d{2}\b/);
  if (match) return match[0];

  return String(new Date().getFullYear());
}

export function shadeColor(hex: string, percent: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return hex;

  const numeric = parseInt(normalized, 16);
  if (Number.isNaN(numeric)) return hex;

  const offset = Math.round((percent / 100) * 255);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const red = clamp(((numeric >> 16) & 0xff) + offset);
  const green = clamp(((numeric >> 8) & 0xff) + offset);
  const blue = clamp((numeric & 0xff) + offset);
  const next = (red << 16) | (green << 8) | blue;

  return '#' + next.toString(16).padStart(6, '0');
}

export interface TemplateRenderArgs {
  design: CertificateDesign;
  data: CertificateRenderData;
}

export interface TemplateRenderOutput {
  body: string;
  styles: string;
}

export type TemplateRenderer = (args: TemplateRenderArgs) => TemplateRenderOutput;

export interface PreparedTemplateRender<K extends string = string> {
  accent: string;
  subtitle: string;
  description: string;
  signatoryOne?: CertificateSignatory;
  signatoryTwo?: CertificateSignatory;
  year: string;
  idDigits: string;
  fontSizes: Record<K, number>;
}

export function getDefaultCertificateFieldValues(design: CertificateDesign, data: CertificateRenderData) {
  return {
    org: data.orgName,
    title: data.courseName,
    course: data.courseName,
    subtitle: design.subtitle ?? '',
    recipient: data.recipientName,
    description: design.descriptionOverride || data.courseDescription,
    certId: data.certificateId,
    certMeta: `${data.certificateId} · ${data.date}`,
    date: data.date
  };
}

export type DefaultCertificateFieldKey = keyof ReturnType<typeof getDefaultCertificateFieldValues>;

export type CustomFieldValues<K extends string> = [Exclude<K, DefaultCertificateFieldKey>] extends [never]
  ? [customValues?: Partial<Record<K, string | undefined | null>>]
  : [
      customValues: Record<Exclude<K, DefaultCertificateFieldKey>, string | undefined | null> &
        Partial<Record<K, string | undefined | null>>
    ];

/**
 * Normalizes design/data values and computes all field font sizes in a single step.
 */
export function prepareCertificateRenderContext<K extends string>(
  design: CertificateDesign,
  data: CertificateRenderData,
  fieldDefinitions: Record<K, FitFontSizeOptions>,
  ...[customValues]: CustomFieldValues<K>
): PreparedTemplateRender<K> {
  const accent = design.accentColor;
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;
  const year = getYear(data.date);
  const idDigits = data.certificateId.match(/\d+/)?.[0] ?? '00';

  const defaultFieldValues = getDefaultCertificateFieldValues(design, data);

  const allFieldValues = {
    ...defaultFieldValues,
    ...customValues
  } as Record<K, string | undefined | null>;

  const fontSizes = computeFieldFontSizes(fieldDefinitions, allFieldValues);

  return {
    accent,
    subtitle,
    description,
    signatoryOne,
    signatoryTwo,
    year,
    idDigits,
    fontSizes
  };
}

export interface SignatoryBlockOptions {
  wrapperClass?: string;
  nameClass: string;
  roleClass: string;
  roleFirst?: boolean;
}

export function renderSignatoryBlock(sig: CertificateSignatory | undefined, options: SignatoryBlockOptions): string {
  if (!sig || sig.enabled === false) {
    const wrapperClass = options.wrapperClass ? ` class="${options.wrapperClass} sig-empty"` : ' class="sig-empty"';
    return `<div${wrapperClass} style="visibility: hidden;" aria-hidden="true"></div>`;
  }

  const sigImg = sig.signatureUrl ? `<img class="sig-img" src="${escapeHtml(sig.signatureUrl)}" alt="" />` : '';

  const nameEl = `<div class="${options.nameClass}">${escapeHtml(sig.name)}</div>`;
  const roleEl = `<div class="${options.roleClass}">${escapeHtml(sig.role)}</div>`;
  const content = options.roleFirst ? `${roleEl}${nameEl}` : `${nameEl}${roleEl}`;
  const wrapperClass = options.wrapperClass ? ` class="${options.wrapperClass}"` : '';

  return `
    <div${wrapperClass}>
      <div class="sig-content">
        <div class="sig-img-slot">${sigImg}</div>
        <div class="sig-text">${content}</div>
      </div>
    </div>
  `;
}

export interface FooterMetaBlockOptions {
  wrapperClass?: string;
  labelClass: string;
  valueClass: string;
}

export function renderFooterMetaBlock(label: string, value: string, options: FooterMetaBlockOptions): string {
  const wrapperClass = options.wrapperClass ? ` class="${options.wrapperClass}"` : '';

  return `
    <div${wrapperClass}>
      <div class="sig-content">
        <div class="sig-img-slot"></div>
        <div class="sig-text">
          <div class="${options.labelClass}">${escapeHtml(label)}</div>
          <div class="${options.valueClass}">${escapeHtml(value)}</div>
        </div>
      </div>
    </div>
  `;
}

export interface SealBlockOptions {
  wrapperClass?: string;
  year: string;
  label: string;
  topSymbol?: string;
}

export function renderSealBlock(options: SealBlockOptions): string {
  const wrapperClass = options.wrapperClass ? ` class="${options.wrapperClass}"` : ' class="seal"';
  const topSymbolHtml = options.topSymbol ? `<div class="star">${escapeHtml(options.topSymbol)}</div>` : '';

  return `
    <div${wrapperClass}>
      ${topSymbolHtml}
      <div class="yr">${escapeHtml(options.year)}</div>
      <div class="lbl">${escapeHtml(options.label)}</div>
    </div>
  `;
}

export const SIGNATURE_IMAGE_STYLES = `
  .sig-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .sig-img-slot {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 44px;
    min-height: 44px;
    margin-bottom: 4px;
    flex-shrink: 0;
  }
  .sig-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }
  .sig-img {
    display: block;
    max-height: 44px;
    max-width: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    background: transparent;
  }
`;

export const FONTS_LINK_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Cinzel:wght@400;500;600;700;800;900&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Archivo+Black&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap';

export const BASE_STYLES = `
  @page {
    size: 1100px 780px;
    margin: 0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1100px; height: 780px; margin: 0; padding: 0; overflow: hidden; background: transparent; }
  body {
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cert {
    width: 1100px;
    height: 780px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 0 3px rgba(0,0,0,0.12);
    box-sizing: border-box;
    page-break-inside: avoid;
  }
  .break-word {
    overflow-wrap: break-word;
    word-break: normal;
  }
  ${SIGNATURE_IMAGE_STYLES}
`;
