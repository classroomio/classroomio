import type { CertificateDesign, CertificateRenderData, CertificateShapeObject, CertificateSignatory } from '../types';
import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from '../constants';
import { computeFieldFontSizes, computeFitFontSize, type FitFontSizeOptions } from '../font-metrics';

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

export function getCertificateIdDigits(value: string | undefined | null): string {
  return String(value ?? '').match(/\d+/)?.[0] ?? '00';
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

export function doesFieldWrap(text: string | undefined | null, fieldOptions: FitFontSizeOptions): boolean {
  if (!text) return false;
  const singleLineSize = computeFitFontSize(text, { ...fieldOptions, allowWrap: false });
  return singleLineSize < fieldOptions.basePx;
}

export function getActiveSignatories(signatories?: (CertificateSignatory | undefined)[]): CertificateSignatory[] {
  return (signatories ?? []).filter((sig): sig is CertificateSignatory => Boolean(sig && sig.enabled !== false));
}

export function getPositionalSignatories(
  signatories?: [CertificateSignatory?, CertificateSignatory?] | CertificateSignatory[]
): [CertificateSignatory | undefined, CertificateSignatory | undefined] {
  const [rawOne, rawTwo] = signatories ?? [];
  const signatoryOne = rawOne && rawOne.enabled !== false ? rawOne : undefined;
  const signatoryTwo = rawTwo && rawTwo.enabled !== false ? rawTwo : undefined;
  return [signatoryOne, signatoryTwo];
}

function getLongestSignatoryValue(signatories: CertificateSignatory[], field: 'name' | 'role'): string {
  if (signatories.length === 0) return '';
  return [...signatories].sort((a, b) => (b[field]?.length ?? 0) - (a[field]?.length ?? 0))[0]?.[field] ?? '';
}

export function doesAnySignatoryRoleWrap(
  signatories: CertificateSignatory[] | undefined,
  fieldOptions: FitFontSizeOptions
): boolean {
  return getActiveSignatories(signatories).some((sig) => doesFieldWrap(sig.role, fieldOptions));
}

export function getFooterCandidateValues(
  signatories: CertificateSignatory[] | undefined,
  data: CertificateRenderData
): string[] {
  const activeSignatories = getActiveSignatories(signatories);
  return [...activeSignatories.map((sig) => sig.name), data.date, data.certificateId].filter((val): val is string =>
    Boolean(val)
  );
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
  anyRoleWraps: boolean;
  roleMinHeight: number;
}

export function getDefaultCertificateFieldValues(design: CertificateDesign, data: CertificateRenderData) {
  const [signatoryOne, signatoryTwo] = getPositionalSignatories(design.signatories);
  const idDigits = getCertificateIdDigits(data.certificateId);
  const activeSignatories = getActiveSignatories(design.signatories);
  const longestSignatoryName = getLongestSignatoryValue(activeSignatories, 'name');
  const longestSignatoryRole = getLongestSignatoryValue(activeSignatories, 'role');
  const footerCandidates = getFooterCandidateValues(design.signatories, data);
  const longestFooterValue = footerCandidates.sort((a, b) => b.length - a.length)[0] ?? data.date;

  return {
    org: data.orgName,
    title: data.courseName,
    course: data.courseName,
    subtitle: design.subtitle ?? '',
    recipient: data.recipientName,
    description: design.descriptionOverride || data.courseDescription,
    certId: data.certificateId,
    certMeta: `${data.certificateId} · ${data.date}`,
    date: data.date,
    signatoryName: longestSignatoryName,
    signatoryRole: longestSignatoryRole,
    signatoryOneName: signatoryOne?.name ?? '',
    signatoryOneRole: signatoryOne?.role ?? '',
    signatoryTwoName: signatoryTwo?.name ?? '',
    signatoryTwoRole: signatoryTwo?.role ?? '',
    sealLabel: data.certificateId,
    recipientNum: data.certificateId,
    num: `№${idDigits}`,
    footerValue: longestFooterValue
  };
}

export type DefaultCertificateFieldKey = keyof ReturnType<typeof getDefaultCertificateFieldValues>;

export type CustomFieldValues<K extends string> = [Exclude<K, DefaultCertificateFieldKey>] extends [never]
  ? [customValues?: Partial<Record<K, string | undefined | null>>]
  : [
      customValues: Record<Exclude<K, DefaultCertificateFieldKey>, string | undefined | null> &
        Partial<Record<K, string | undefined | null>>
    ];

const SIGNATORY_FIELD_PROPS = {
  signatoryName: 'name',
  signatoryRole: 'role'
} as const satisfies Record<
  DefaultCertificateFieldKey & ('signatoryName' | 'signatoryRole'),
  keyof Pick<CertificateSignatory, 'name' | 'role'>
>;

const SIGNATORY_ROLE_KEY = 'signatoryRole' as const satisfies DefaultCertificateFieldKey;

type SignatorySharedField = keyof typeof SIGNATORY_FIELD_PROPS;

function isSignatorySharedField(key: string): key is SignatorySharedField {
  return key in SIGNATORY_FIELD_PROPS;
}

function computeMinFitFontSize(options: FitFontSizeOptions, values: Array<string | undefined | null>): number {
  const activeValues = values.filter((val): val is string => Boolean(val));
  if (activeValues.length === 0) return options.basePx;

  return Math.min(...activeValues.map((val) => computeFitFontSize(val, options)));
}

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
  const [signatoryOne, signatoryTwo] = getPositionalSignatories(design.signatories);
  const year = getYear(data.date);
  const idDigits = getCertificateIdDigits(data.certificateId);

  const defaultFieldValues = getDefaultCertificateFieldValues(design, data);

  const allFieldValues = {
    ...defaultFieldValues,
    ...customValues
  } as Record<DefaultCertificateFieldKey | K, string | undefined | null>;

  const activeSignatories = getActiveSignatories(design.signatories);

  const fontSizes = {} as Record<K, number>;
  for (const key in fieldDefinitions) {
    const isCustom = Boolean(customValues && key in customValues);
    const signatoryProp = isSignatorySharedField(key) ? SIGNATORY_FIELD_PROPS[key] : null;

    if (signatoryProp && !isCustom && activeSignatories.length > 0) {
      fontSizes[key] = computeMinFitFontSize(
        fieldDefinitions[key],
        activeSignatories.map((sig) => sig[signatoryProp])
      );
    } else if (key === ('footerValue' satisfies DefaultCertificateFieldKey) && !isCustom) {
      fontSizes[key] = computeMinFitFontSize(fieldDefinitions[key], getFooterCandidateValues(design.signatories, data));
    } else {
      fontSizes[key] = computeFitFontSize(allFieldValues[key], fieldDefinitions[key]);
    }
  }

  const signatoryRoleField = (fieldDefinitions as Partial<Record<DefaultCertificateFieldKey, FitFontSizeOptions>>)[
    SIGNATORY_ROLE_KEY
  ];
  const isCustomRole = Boolean(customValues && SIGNATORY_ROLE_KEY in customValues);
  const anyRoleWraps = signatoryRoleField
    ? isCustomRole
      ? doesFieldWrap(allFieldValues[SIGNATORY_ROLE_KEY], signatoryRoleField)
      : doesAnySignatoryRoleWrap(design.signatories, signatoryRoleField)
    : false;
  const roleSingleLineHeight = signatoryRoleField
    ? Math.ceil(signatoryRoleField.basePx * (signatoryRoleField.lineHeight ?? 1.2))
    : 0;
  const roleMinHeight = anyRoleWraps && signatoryRoleField ? signatoryRoleField.maxHeight : roleSingleLineHeight;

  return {
    accent,
    subtitle,
    description,
    signatoryOne,
    signatoryTwo,
    year,
    idDigits,
    fontSizes,
    anyRoleWraps,
    roleMinHeight
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
    size: ${CERTIFICATE_WIDTH}px ${CERTIFICATE_HEIGHT}px;
    margin: 0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${CERTIFICATE_WIDTH}px; height: ${CERTIFICATE_HEIGHT}px; margin: 0; padding: 0; overflow: hidden; background: transparent; }
  body {
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cert {
    width: ${CERTIFICATE_WIDTH}px;
    height: ${CERTIFICATE_HEIGHT}px;
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

export function gradientCoordinates(angleDeg: number): { x1: string; y1: string; x2: string; y2: string } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const x = Math.cos(angleRad);
  const y = Math.sin(angleRad);
  const x1 = Math.round(50 - x * 50);
  const y1 = Math.round(50 - y * 50);
  const x2 = Math.round(50 + x * 50);
  const y2 = Math.round(50 + y * 50);
  return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
}

export function renderShape(shape: CertificateShapeObject): string {
  const id = escapeHtml(shape.id);
  const width = Math.max(1, Math.round(shape.frame.width));
  const height = Math.max(1, Math.round(shape.frame.height));
  const x = Math.round(shape.frame.x);
  const y = Math.round(shape.frame.y);
  const rotation = shape.frame.rotation ?? 0;
  const opacity = Math.max(0, Math.min(1, shape.opacity ?? 1));
  const zIndex = shape.zIndex ?? 0;
  const borderRadius = Math.max(0, Math.round(shape.borderRadius ?? 0));

  const strokeWidth = shape.stroke?.width ? Math.max(0, Math.round(shape.stroke.width)) : 0;
  const strokeColor = shape.stroke?.color ?? 'none';
  const strokeStyle = shape.stroke?.style ?? 'solid';
  const strokeDash = strokeStyle === 'dashed' ? 'stroke-dasharray="6 4"' : '';
  const strokeAttr =
    strokeWidth > 0 && strokeColor !== 'none'
      ? `stroke="${escapeHtml(strokeColor)}" stroke-width="${strokeWidth}" ${strokeDash}`
      : 'stroke="none"';

  let fillAttr = 'none';
  let defs = '';

  if (shape.fill.type === 'solid') {
    fillAttr = escapeHtml(shape.fill.color);
  } else if (shape.fill.type === 'linear-gradient') {
    const gradId = `grad-${id}`;
    const coords = gradientCoordinates(shape.fill.angle ?? 90);
    const stops = (shape.fill.stops ?? [])
      .map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${escapeHtml(s.color)}" />`)
      .join('');
    defs = `<defs><linearGradient id="${gradId}" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">${stops}</linearGradient></defs>`;
    fillAttr = `url(#${gradId})`;
  }

  let svgContent = '';
  const halfStroke = strokeWidth / 2;
  const innerW = Math.max(0, width - strokeWidth);
  const innerH = Math.max(0, height - strokeWidth);

  switch (shape.shape) {
    case 'rectangle':
    case 'frame': {
      const rx = Math.max(0, borderRadius - halfStroke);
      svgContent = `<rect x="${halfStroke}" y="${halfStroke}" width="${innerW}" height="${innerH}" rx="${rx}" ry="${rx}" fill="${fillAttr}" ${strokeAttr} />`;
      break;
    }
    case 'ellipse': {
      const rx = Math.max(1, innerW / 2);
      const ry = Math.max(1, innerH / 2);
      svgContent = `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${rx}" ry="${ry}" fill="${fillAttr}" ${strokeAttr} />`;
      break;
    }
    case 'line': {
      const effectiveStroke =
        strokeWidth > 0
          ? strokeAttr
          : `stroke="${shape.fill.type === 'solid' ? escapeHtml(shape.fill.color) : '#000000'}" stroke-width="2"`;
      svgContent = `<line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" fill="none" ${effectiveStroke} />`;
      break;
    }
    default:
      svgContent = `<rect x="${halfStroke}" y="${halfStroke}" width="${innerW}" height="${innerH}" fill="${fillAttr}" ${strokeAttr} />`;
  }

  return `<div class="studio-shape" data-certificate-element="${id}" data-shape-type="${escapeHtml(shape.shape)}" style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;transform:rotate(${rotation}deg);transform-origin:center center;opacity:${opacity};z-index:${zIndex};pointer-events:none;"><svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;">${defs}${svgContent}</svg></div>`;
}

export function renderShapes(shapes: CertificateShapeObject[] | undefined): string {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) return '';

  return [...shapes]
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map(renderShape)
    .join('');
}
