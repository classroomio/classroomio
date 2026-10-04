import { CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT } from '../constants';
import type { CertificateElementId, CertificateSignatory } from '../types';
import { CERTIFICATE_FONTS, type CertificateFontFamily } from '../font-metrics';
import {
  escapeHtml,
  getSafeCertificateImageUrl,
  getYear,
  prepareCertificateRenderContext,
  type TemplateRenderer,
  type TemplateRenderArgs,
  type TemplateRenderOutput
} from './shared';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const ALLOWED_FONTS = new Set<CertificateFontFamily>(Object.values(CERTIFICATE_FONTS));

function safeColor(value: string | undefined, fallback: string): string {
  if (!value || !HEX_COLOR_PATTERN.test(value)) return fallback;
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  return value;
}

function safeFont(value: string | undefined, fallback: CertificateFontFamily): CertificateFontFamily {
  return value && ALLOWED_FONTS.has(value as CertificateFontFamily) ? (value as CertificateFontFamily) : fallback;
}

function safeNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return fallback;

  return Math.max(minimum, Math.min(maximum, value as number));
}

export const renderModular: TemplateRenderer = ({ design, data }: TemplateRenderArgs): TemplateRenderOutput => {
  const elements = design.elements ?? {};
  const copy = design.copy ?? {};
  const border = design.border ?? {};
  const typography = design.typography ?? {};
  const background = design.background ?? {};
  const badge = design.badge ?? {};
  const qrCode = design.qrCode ?? { enabled: true, position: 'bottom_right' };
  const layout = design.layout ?? {};
  const titleShift = layout.titleOffsetY ?? 0;
  const recipientShift = layout.recipientOffsetY ?? 0;
  const courseShift = layout.courseOffsetY ?? 0;
  const badgeShift = layout.badgeOffsetY ?? 0;
  const footerShift = layout.footerOffsetY ?? 0;

  const isElementEnabled = (id: CertificateElementId, defaultVal = true): boolean => {
    return elements[id]?.enabled ?? defaultVal;
  };

  const showBorder = isElementEnabled('border', true);
  const showHeader = isElementEnabled('header', true);
  const showTitle = isElementEnabled('title', true);
  const showSubtitle = isElementEnabled('subtitle', true);
  const showRecipient = true;
  const showCourse = true;
  const showDescription = isElementEnabled('description', true);
  const showDate = isElementEnabled('date', true);
  const showBadge = isElementEnabled('badge', true) && badge.style !== 'none';
  const showSignatories = isElementEnabled('signatories', true);
  const showQr = isElementEnabled('qrCode', true) && qrCode.enabled !== false;

  const getElementStyleAndAttrs = (id: CertificateElementId, defaultShiftY = 0) => {
    const elLayout = elements[id];
    const isCustom = elLayout?.positionMode === 'custom' && Number.isFinite(elLayout.x) && Number.isFinite(elLayout.y);
    if (isCustom) {
      const width = safeNumber(elLayout.width, 0, 0, CERTIFICATE_WIDTH);
      const height = safeNumber(elLayout.height, 0, 0, CERTIFICATE_HEIGHT);
      const x = safeNumber(elLayout.x, 0, 0, CERTIFICATE_WIDTH - width);
      const y = safeNumber(elLayout.y, 0, 0, CERTIFICATE_HEIGHT - height);
      const zIndex = safeNumber(elLayout.zIndex, 2, 0, 20);
      const sizeStyle = `${width > 0 ? ` width: ${width}px;` : ''}${height > 0 ? ` height: ${height}px;` : ''}`;

      return {
        attrs: `data-certificate-element="${id}" data-position-mode="custom"`,
        style: `position: absolute; left: ${x}px; top: ${y}px; z-index: ${zIndex}; transform: none; margin: 0;${sizeStyle}`
      };
    }
    const transformStyle = defaultShiftY ? `transform: translateY(${defaultShiftY}px);` : '';
    return {
      attrs: `data-certificate-element="${id}" data-position-mode="auto"`,
      style: transformStyle
    };
  };

  const primaryColor = safeColor(border.primaryColor, safeColor(design.accentColor, '#d4af37'));
  const cornerAccent = safeColor(border.accentColor, primaryColor);
  const borderWidth = safeNumber(border.width, 12, 1, 48);
  const borderStyle = border.style ?? 'victorian';

  const titleFont = safeFont(typography.titleFont, CERTIFICATE_FONTS.bodoniModa);
  const recipientFont = safeFont(typography.recipientFont, CERTIFICATE_FONTS.greatVibes);
  const bodyFont = safeFont(typography.bodyFont, CERTIFICATE_FONTS.cormorantGaramond);
  const textColor = safeColor(typography.primaryColor, '#1a1a2e');
  const letterSpacing = safeNumber(typography.letterSpacing, 0.05, 0, 0.5);

  const bgStyle = background.style ?? 'parchment';
  const bgPrimary = safeColor(background.primaryColor, bgStyle === 'parchment' ? '#FAF8F2' : '#FFFFFF');
  const bgSecondary = safeColor(background.secondaryColor, '#F3EDE0');

  const badgeStyle = badge.style ?? 'gold_seal';
  const badgeLabel = escapeHtml(badge.label || 'OFFICIAL SEAL');
  const foilColor = safeColor(badge.foilColor, primaryColor);

  const year = getYear(data.date);
  const orgNameValue = copy.organizationName || data.orgName || 'ACME UNIVERSITY';
  const titleValue = copy.title || data.labels?.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT';
  const subtitleValue = copy.presentation || design.subtitle || data.labels?.presentedToLabel || 'PROUDLY PRESENTED TO';
  const recipientValue = data.recipientName || 'Jane Doe';
  const courseNameValue = data.courseName || '';
  const completionLabelValue = copy.completion || data.labels?.completionLabel || 'FOR SUCCESSFUL COMPLETION OF';
  const descriptionValue =
    design.descriptionOverride ||
    data.courseDescription ||
    'For successfully mastering Fullstack Engineering and demonstrating leadership and academic rigor.';
  const dateLabelValue = copy.dateLabel || 'Date of Conferment:';
  const qrLabelValue = copy.verifiedCredentialLabel || data.labels?.verifiedCredentialLabel || 'CREDENTIAL REFERENCE';
  const activeSignatories = showSignatories
    ? (design.signatories ?? []).filter((signatory) => signatory && signatory.enabled !== false)
    : [];

  const FIELDS = {
    org: {
      maxWidth: 780,
      maxHeight: 35,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 14,
      allowWrap: false,
      letterSpacingEm: 0.3,
      textTransform: 'uppercase' as const
    },
    certificateTitle: {
      maxWidth: 820,
      maxHeight: 52,
      fontFamily: titleFont,
      basePx: 38,
      lineHeight: 1.15,
      allowWrap: true,
      letterSpacingEm: letterSpacing,
      textTransform: 'uppercase' as const
    },
    presentation: {
      maxWidth: 780,
      maxHeight: 30,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 12,
      allowWrap: false,
      letterSpacingEm: 0.25,
      textTransform: 'uppercase' as const
    },
    recipient: {
      maxWidth: 780,
      maxHeight: 68,
      fontFamily: recipientFont,
      basePx: 56,
      lineHeight: 1.1,
      allowWrap: true
    },
    course: {
      maxWidth: 740,
      maxHeight: 32,
      fontFamily: titleFont,
      basePx: 20,
      lineHeight: 1.2,
      allowWrap: true,
      letterSpacingEm: 0.05
    },
    completionLabel: {
      maxWidth: 740,
      maxHeight: 22,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 10,
      allowWrap: false,
      letterSpacingEm: 0.15,
      textTransform: 'uppercase' as const
    },
    description: {
      maxWidth: 680,
      maxHeight: 60,
      fontFamily: bodyFont,
      basePx: 15,
      lineHeight: 1.4,
      allowWrap: true,
      fontStyle: 'italic' as const
    },
    date: {
      maxWidth: 440,
      maxHeight: 24,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 11,
      allowWrap: false,
      letterSpacingEm: 0.05
    },
    signatoryName: {
      maxWidth: activeSignatories.length >= 3 ? 190 : 220,
      maxHeight: 24,
      fontFamily: bodyFont,
      basePx: 16,
      lineHeight: 1.2,
      allowWrap: false,
      fontWeight: 600 as const
    },
    signatoryRole: {
      maxWidth: activeSignatories.length >= 3 ? 190 : 220,
      maxHeight: 26,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 10,
      lineHeight: 1.2,
      allowWrap: true,
      letterSpacingEm: 0.15,
      textTransform: 'uppercase' as const
    },
    badgeLabel: {
      maxWidth: 85,
      maxHeight: 14,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 8,
      allowWrap: false,
      letterSpacingEm: 0.1,
      textTransform: 'uppercase' as const
    },
    qrLabel: {
      maxWidth: 105,
      maxHeight: 12,
      fontFamily: CERTIFICATE_FONTS.cinzel,
      basePx: 8,
      allowWrap: false,
      letterSpacingEm: 0.1,
      textTransform: 'uppercase' as const
    },
    certificateId: {
      maxWidth: 105,
      maxHeight: 12,
      fontFamily: CERTIFICATE_FONTS.inter,
      basePx: 8,
      allowWrap: false,
      letterSpacingEm: 0.04
    }
  } as const;

  const { fontSizes } = prepareCertificateRenderContext(design, data, FIELDS, {
    org: orgNameValue,
    certificateTitle: titleValue,
    presentation: subtitleValue,
    recipient: recipientValue,
    course: courseNameValue,
    completionLabel: completionLabelValue,
    description: descriptionValue,
    date: `${dateLabelValue} ${data.date}`,
    badgeLabel: badge.label || 'OFFICIAL SEAL',
    qrLabel: qrLabelValue,
    certificateId: data.certificateId
  });

  const orgName = escapeHtml(orgNameValue);
  const title = escapeHtml(titleValue);
  const subtitle = escapeHtml(subtitleValue);
  const recipient = escapeHtml(recipientValue);
  const courseName = escapeHtml(courseNameValue);
  const completionLabel = escapeHtml(completionLabelValue);
  const description = escapeHtml(descriptionValue);
  const dateLabel = escapeHtml(dateLabelValue);
  const dateStr = escapeHtml(data.date);
  const certId = escapeHtml(data.certificateId);
  const qrLabel = escapeHtml(qrLabelValue);

  // Background SVG element
  let bgSvg = '';
  if (bgStyle === 'parchment') {
    bgSvg = `
      <rect width="100%" height="100%" fill="${bgPrimary}"/>
      <radialGradient id="parchment-grad" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="${bgPrimary}" stop-opacity="0"/>
        <stop offset="75%" stop-color="${bgSecondary}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${bgSecondary}" stop-opacity="0.5"/>
      </radialGradient>
      <rect width="100%" height="100%" fill="url(#parchment-grad)"/>
    `;
  } else if (bgStyle === 'guilloche') {
    bgSvg = `
      <rect width="100%" height="100%" fill="${bgPrimary}"/>
      <svg class="guilloche-bg" width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" opacity="0.08" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="guilloche-pat" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 0,60 C 30,30 30,90 60,60 C 90,30 90,90 120,60" fill="none" stroke="${primaryColor}" stroke-width="1.2"/>
            <circle cx="60" cy="60" r="45" fill="none" stroke="${primaryColor}" stroke-width="0.8"/>
            <circle cx="60" cy="60" r="30" fill="none" stroke="${primaryColor}" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#guilloche-pat)"/>
      </svg>
    `;
  } else if (bgStyle === 'gradient') {
    bgSvg = `
      <defs>
        <radialGradient id="soft-grad" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stop-color="${bgPrimary}"/>
          <stop offset="100%" stop-color="${bgSecondary}"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#soft-grad)"/>
    `;
  } else {
    bgSvg = `<rect width="100%" height="100%" fill="${bgPrimary}"/>`;
  }

  // Border SVG
  let borderSvg = '';
  const pad = 24;
  const innerPad = pad + borderWidth;
  const w = CERTIFICATE_WIDTH;
  const h = CERTIFICATE_HEIGHT;

  if (showBorder) {
    const customBorderImageUrl = getSafeCertificateImageUrl(border.customImageUrl);
    if (borderStyle === 'custom_image' && customBorderImageUrl) {
      borderSvg = `
        <image href="${escapeHtml(customBorderImageUrl)}" x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" preserveAspectRatio="none"/>
      `;
    } else if (borderStyle === 'victorian') {
      borderSvg = `
        <!-- Victorian Outer & Inner Rules -->
        <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="3"/>
        <rect x="${pad + 6}" y="${pad + 6}" width="${w - (pad + 6) * 2}" height="${h - (pad + 6) * 2}" fill="none" stroke="${primaryColor}" stroke-width="1" stroke-dasharray="4,2"/>
        <rect x="${innerPad}" y="${innerPad}" width="${w - innerPad * 2}" height="${h - innerPad * 2}" fill="none" stroke="${cornerAccent}" stroke-width="1.5"/>

        <!-- Victorian Corner Ornaments (SVG Paths) -->
        <g transform="translate(${pad + 8}, ${pad + 8})">
          <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
          <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
          <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
        </g>
        <g transform="translate(${w - pad - 8}, ${pad + 8}) scale(-1, 1)">
          <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
          <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
          <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
        </g>
        <g transform="translate(${pad + 8}, ${h - pad - 8}) scale(1, -1)">
          <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
          <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
          <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
        </g>
        <g transform="translate(${w - pad - 8}, ${h - pad - 8}) scale(-1, -1)">
          <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
          <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
          <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
        </g>
      `;
    } else if (borderStyle === 'double_gold') {
      borderSvg = `
        <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="${pad + 10}" y="${pad + 10}" width="${w - (pad + 10) * 2}" height="${h - (pad + 10) * 2}" fill="none" stroke="${cornerAccent}" stroke-width="1.5"/>
        <rect x="${pad + 16}" y="${pad + 16}" width="${w - (pad + 16) * 2}" height="${h - (pad + 16) * 2}" fill="none" stroke="${primaryColor}" stroke-width="1"/>
        <rect x="${pad + 4}" y="${pad + 4}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
        <rect x="${w - pad - 20}" y="${pad + 4}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
        <rect x="${pad + 4}" y="${h - pad - 20}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
        <rect x="${w - pad - 20}" y="${h - pad - 20}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
      `;
    } else if (borderStyle === 'geometric') {
      borderSvg = `
        <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="3"/>
        <path d="M ${pad + 4},${pad + 24} L ${pad + 24},${pad + 24} L ${pad + 24},${pad + 4}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
        <path d="M ${w - pad - 4},${pad + 24} L ${w - pad - 24},${pad + 24} L ${w - pad - 24},${pad + 4}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
        <path d="M ${pad + 4},${h - pad - 24} L ${pad + 24},${h - pad - 24} L ${pad + 24},${h - pad - 24}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
        <path d="M ${w - pad - 4},${h - pad - 24} L ${w - pad - 24},${h - pad - 24} L ${w - pad - 24},${h - pad - 24}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
      `;
    } else if (borderStyle === 'minimal') {
      borderSvg = `
        <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
      `;
    }
  }

  // Badge SVG
  let badgeSvg = '';
  if (showBadge) {
    const customBadgeImageUrl = getSafeCertificateImageUrl(badge.customImageUrl);
    const safeOrgLogoUrl = getSafeCertificateImageUrl(badge.customImageUrl || data.orgLogoUrl);
    if (badgeStyle === 'org_logo') {
      if (safeOrgLogoUrl) {
        badgeSvg = `
        <div class="modular-seal modular-org-logo-seal" title="${escapeHtml(orgNameValue)}">
          <div class="org-logo-seal-inner">
            <img src="${escapeHtml(safeOrgLogoUrl)}" alt="${escapeHtml(orgNameValue)}" />
          </div>
        </div>
      `;
      } else {
        const orgInitial = escapeHtml((orgNameValue || 'O').charAt(0).toUpperCase());
        badgeSvg = `
        <div class="modular-seal modular-org-logo-seal" title="${escapeHtml(orgNameValue)}">
          <svg viewBox="0 0 120 120" width="108" height="108">
            <defs>
              <linearGradient id="org-seal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFDF5"/>
                <stop offset="50%" stop-color="#F4ECE1"/>
                <stop offset="100%" stop-color="#E2D4C3"/>
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="url(#org-seal-grad)" stroke="${foilColor}" stroke-width="2.5"/>
            <circle cx="60" cy="60" r="47" fill="none" stroke="${foilColor}" stroke-width="1.2" stroke-dasharray="3,2"/>
            <circle cx="60" cy="60" r="41" fill="none" stroke="${foilColor}" stroke-width="0.8"/>
            <text x="60" y="66" font-family="'Cinzel', serif" font-size="32" font-weight="700" fill="${primaryColor}" text-anchor="middle">
              ${orgInitial}
            </text>
            <text x="60" y="80" font-family="'Bodoni Moda', serif" font-size="8" font-weight="600" fill="${foilColor}" text-anchor="middle" letter-spacing="1">
              SEAL
            </text>
          </svg>
        </div>
      `;
      }
    } else if (badgeStyle === 'custom' && customBadgeImageUrl) {
      badgeSvg = `
        <div class="modular-seal modular-custom-seal" title="${badgeLabel}">
          <img src="${escapeHtml(customBadgeImageUrl)}" alt="${badgeLabel}" style="max-width: 108px; max-height: 108px; object-fit: contain;" />
        </div>
      `;
    } else if (badgeStyle === 'gold_seal') {
      badgeSvg = `
        <div class="modular-seal" title="${badgeLabel}">
          <svg viewBox="0 0 120 120" width="108" height="108">
            <defs>
              <linearGradient id="seal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFF4D0"/>
                <stop offset="50%" stop-color="${foilColor}"/>
                <stop offset="100%" stop-color="#85581A"/>
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="url(#seal-grad)" stroke="${foilColor}" stroke-width="2"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
            <circle cx="60" cy="60" r="42" fill="none" stroke="#85581A" stroke-width="1"/>
            <text x="60" y="55" font-family="'Cinzel', serif" font-size="${fontSizes.badgeLabel}" font-weight="700" fill="#3a2515" text-anchor="middle" letter-spacing="1">
              ${badgeLabel}
            </text>
            <text x="60" y="70" font-family="'Bodoni Moda', serif" font-size="12" font-style="italic" font-weight="700" fill="#3a2515" text-anchor="middle">
              ★ ★ ★
            </text>
          </svg>
        </div>
      `;
    } else if (badgeStyle === 'ribbon') {
      badgeSvg = `
        <div class="modular-ribbon" title="${badgeLabel}">
          <svg viewBox="0 0 100 130" width="90" height="117">
            <defs>
              <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFE8A3"/>
                <stop offset="60%" stop-color="${foilColor}"/>
                <stop offset="100%" stop-color="#6E440D"/>
              </linearGradient>
            </defs>
            <polygon points="25,65 15,120 35,105 45,70" fill="#6E440D" opacity="0.85"/>
            <polygon points="75,65 85,120 65,105 55,70" fill="#6E440D" opacity="0.85"/>
            <circle cx="50" cy="45" r="38" fill="url(#ribbon-grad)" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="50" cy="45" r="32" fill="none" stroke="#6E440D" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="44" font-family="'Cinzel', serif" font-size="7" font-weight="700" fill="#291A04" text-anchor="middle" letter-spacing="1">
              HONORS
            </text>
            <text x="50" y="55" font-family="'Bodoni Moda', serif" font-size="9" font-weight="700" fill="#291A04" text-anchor="middle">
              ${year}
            </text>
          </svg>
        </div>
      `;
    } else if (badgeStyle === 'wax_stamp') {
      badgeSvg = `
        <div class="modular-stamp" title="${badgeLabel}">
          <svg viewBox="0 0 100 100" width="90" height="90">
            <circle cx="50" cy="50" r="44" fill="#8B0000" stroke="#5A0000" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#C84B31" stroke-width="1.5"/>
            <text x="50" y="55" font-family="'Cinzel', serif" font-size="14" font-weight="900" fill="#FFF5EA" text-anchor="middle">
              CIO
            </text>
          </svg>
        </div>
      `;
    }
  }

  // Credential reference element. This intentionally does not imitate a
  // scannable QR code; verification can be added once issuance URLs exist.
  let qrSvg = '';
  if (showQr) {
    const qrLayout = elements.qrCode;
    const isCustomQr =
      qrLayout?.positionMode === 'custom' && Number.isFinite(qrLayout.x) && Number.isFinite(qrLayout.y);
    const qrPositionClasses = {
      bottom_right: 'pos-bottom-right',
      bottom_left: 'pos-bottom-left',
      center_footer: 'pos-center-footer',
      top_right: 'pos-top-right',
      custom: 'pos-bottom-right'
    } as const;
    const qrPosClass = qrPositionClasses[qrCode.position ?? 'bottom_right'];
    const qrZone = getElementStyleAndAttrs('qrCode');
    const qrInlineStyle = isCustomQr ? `${qrZone.style} bottom: auto; right: auto;` : '';

    qrSvg = `
      <div class="modular-qr ${isCustomQr ? '' : qrPosClass}" ${qrZone.attrs} style="${qrInlineStyle}">
        <div class="qr-box">
          <svg viewBox="0 0 48 48" width="44" height="44" fill="${textColor}">
            <rect x="3" y="3" width="42" height="42" rx="6" fill="none" stroke="${textColor}" stroke-width="2"/>
            <text x="24" y="29" font-family="'Inter', sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${textColor}">ID</text>
          </svg>
        </div>
        <div class="qr-info">
          <span class="qr-label" style="font-size: ${fontSizes.qrLabel}px;">${qrLabel}</span>
          <span class="qr-id" style="font-size: ${fontSizes.certificateId}px;">${certId}</span>
        </div>
      </div>
    `;
  }

  const renderSignatoryCol = (signatory: CertificateSignatory, index: number) => {
    const signatureUrl = getSafeCertificateImageUrl(signatory.signatureUrl);
    const signatureImage = signatureUrl
      ? `<div class="sig-img-wrap"><img src="${escapeHtml(signatureUrl)}" alt="" class="sig-img"/></div>`
      : `<div class="sig-spacer"></div>`;

    const elId = `signatory-${index}` as CertificateElementId;
    const zone = getElementStyleAndAttrs(elId);

    return `
      <div class="sig-col" ${zone.attrs} style="${zone.style}">
        ${signatureImage}
        <div class="sig-line" style="border-top-color: ${primaryColor};"></div>
        <div class="sig-name" style="font-family: '${bodyFont}', serif; font-size: ${fontSizes.signatoryName}px;">${escapeHtml(signatory.name)}</div>
        <div class="sig-role" style="color: ${primaryColor}; font-size: ${fontSizes.signatoryRole}px;">${escapeHtml(signatory.role)}</div>
      </div>
    `;
  };

  // Dynamic layout attributes and styles for element zones
  const headerZone = getElementStyleAndAttrs('header');
  const titleZone = getElementStyleAndAttrs('title', titleShift);
  const subtitleZone = getElementStyleAndAttrs('subtitle', titleShift);
  const recipientZone = getElementStyleAndAttrs('recipient', recipientShift);
  const courseZone = getElementStyleAndAttrs('course', courseShift);
  const descriptionZone = getElementStyleAndAttrs('description', courseShift);
  const dateZone = getElementStyleAndAttrs('date');
  const badgeZone = getElementStyleAndAttrs('badge', badgeShift);
  const sigZone = getElementStyleAndAttrs('signatories', footerShift);

  const isCustomBadge =
    elements.badge?.positionMode === 'custom' && elements.badge.x != null && elements.badge.y != null;

  // Build Footer Zone HTML based on signatory count and badge placement
  let footerHtml = '';
  const numSigs = activeSignatories.length;

  if (numSigs > 0 || (showBadge && !isCustomBadge)) {
    if (numSigs === 0) {
      // Badge only, centered
      footerHtml = `
        <div class="footer-zone footer-badge-only" style="${sigZone.style}">
          <div class="badge-container" ${badgeZone.attrs} style="${badgeZone.style}">
            ${badgeSvg}
          </div>
        </div>
      `;
    } else if (numSigs === 1) {
      if (showBadge && !isCustomBadge) {
        footerHtml = `
          <div class="footer-zone footer-one-sig" style="${sigZone.style}">
            <div class="sig-container">${renderSignatoryCol(activeSignatories[0], 0)}</div>
            <div class="badge-container" ${badgeZone.attrs} style="${badgeZone.style}">
              ${badgeSvg}
            </div>
          </div>
        `;
      } else {
        footerHtml = `
          <div class="footer-zone footer-one-sig-centered" style="${sigZone.style}">
            <div class="sig-container">${renderSignatoryCol(activeSignatories[0], 0)}</div>
          </div>
        `;
      }
    } else if (numSigs === 2) {
      footerHtml = `
        <div class="footer-zone footer-two-sig" style="${sigZone.style}">
          <div class="sig-container">${renderSignatoryCol(activeSignatories[0], 0)}</div>
          <div class="badge-container" ${badgeZone.attrs} style="${badgeZone.style}">
            ${showBadge && !isCustomBadge ? badgeSvg : ''}
          </div>
          <div class="sig-container">${renderSignatoryCol(activeSignatories[1], 1)}</div>
        </div>
      `;
    } else {
      // 3 signatories
      footerHtml = `
        <div class="footer-zone footer-three-sig" style="${sigZone.style}">
          ${showBadge && !isCustomBadge ? `<div class="badge-container badge-above-three" ${badgeZone.attrs} style="${badgeZone.style}">${badgeSvg}</div>` : ''}
          <div class="sig-container">${renderSignatoryCol(activeSignatories[0], 0)}</div>
          <div class="sig-container">${renderSignatoryCol(activeSignatories[1], 1)}</div>
          <div class="sig-container">${renderSignatoryCol(activeSignatories[2], 2)}</div>
        </div>
      `;
    }
  }

  const customBadgeHtml =
    showBadge && isCustomBadge
      ? `<div class="badge-custom-wrap" ${badgeZone.attrs} style="${badgeZone.style}">${badgeSvg}</div>`
      : '';

  const body = `
    <div class="cert t-modular" style="color: ${textColor};">
      <svg class="modular-bg-svg" width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        ${bgSvg}
        ${borderSvg}
      </svg>

      <div class="modular-content">
        <!-- Header / Org -->
        ${
          showHeader
            ? `<div class="header-zone" ${headerZone.attrs} style="${headerZone.style}">
                 <div class="org-name" style="color: ${primaryColor}; letter-spacing: 0.3em; font-size: ${fontSizes.org}px;">${orgName}</div>
               </div>`
            : ''
        }

        <!-- Main Title & Subtitle -->
        ${
          showTitle || showSubtitle
            ? `<div class="title-zone">
                 ${
                   showTitle
                     ? `<h1 class="main-title" ${titleZone.attrs} style="${titleZone.style} font-family: '${titleFont}', serif; letter-spacing: ${letterSpacing}em; font-size: ${fontSizes.certificateTitle}px;">
                          ${title}
                        </h1>`
                     : ''
                 }
                 ${
                   showSubtitle
                     ? `<div class="subtitle" ${subtitleZone.attrs} style="${subtitleZone.style} color: ${primaryColor}; letter-spacing: 0.25em; font-size: ${fontSizes.presentation}px;">
                          ${subtitle}
                        </div>`
                     : ''
                 }
               </div>`
            : ''
        }

        <!-- Recipient -->
        ${
          showRecipient
            ? `<div class="recipient-zone" ${recipientZone.attrs} style="${recipientZone.style}">
                 <div class="recipient-name" style="font-family: '${recipientFont}', cursive, serif; font-size: ${fontSizes.recipient}px;">
                   ${recipient}
                 </div>
                 <div class="recipient-rule" style="background-color: ${primaryColor};"></div>
               </div>`
            : ''
        }

        <!-- Course & Description -->
        ${
          showCourse || showDescription
            ? `<div class="course-zone">
                 ${
                   showCourse
                     ? `<div ${courseZone.attrs} style="${courseZone.style}">
                          <div class="completion-label" style="font-size: ${fontSizes.completionLabel}px;">${completionLabel}</div>
                          <div class="course-name" style="font-family: '${titleFont}', serif; font-size: ${fontSizes.course}px;">
                            ${courseName}
                          </div>
                        </div>`
                     : ''
                 }
                 ${
                   showDescription
                     ? `<div class="course-desc" ${descriptionZone.attrs} style="${descriptionZone.style} font-family: '${bodyFont}', serif; font-size: ${fontSizes.description}px;">
                          ${description}
                        </div>`
                     : ''
                 }
               </div>`
            : ''
        }

        <!-- Meta / Date -->
        ${
          showDate
            ? `<div class="meta-zone" ${dateZone.attrs} style="${dateZone.style}">
                 <div class="meta-date" style="font-size: ${fontSizes.date}px;">${dateLabel} <strong>${dateStr}</strong></div>
               </div>`
            : ''
        }

        <!-- Footer / Signatures, Seal -->
        ${footerHtml}

        <!-- Custom-positioned Badge (if detached from footer) -->
        ${customBadgeHtml}

        <!-- QR Code container -->
        ${qrSvg}
      </div>
    </div>
  `;

  const styles = `
    .t-modular {
      width: ${CERTIFICATE_WIDTH}px;
      height: ${CERTIFICATE_HEIGHT}px;
      position: relative;
      overflow: hidden;
      display: flex;
      box-sizing: border-box;
      background: transparent;
    }
    .t-modular .modular-bg-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }
    .t-modular .modular-content {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: ${innerPad + 18}px ${innerPad + 36}px ${innerPad + 16}px;
      box-sizing: border-box;
      text-align: center;
    }
    .t-modular .header-zone {
      width: 100%;
      margin-top: 4px;
    }
    .t-modular .org-name {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .t-modular .title-zone {
      margin-top: 8px;
    }
    .t-modular .main-title {
      font-size: 38px;
      font-weight: 700;
      line-height: 1.15;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .t-modular .subtitle {
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .t-modular .recipient-zone {
      width: 100%;
      max-width: 780px;
      margin: 8px auto 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .t-modular .recipient-name {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: 6px;
      width: 100%;
      overflow-wrap: break-word;
    }
    .t-modular .recipient-rule {
      width: 60%;
      height: 2px;
      margin-top: 2px;
      opacity: 0.85;
    }
    .t-modular .course-zone {
      max-width: 740px;
      margin-top: 8px;
    }
    .t-modular .course-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .t-modular .completion-label {
      font-family: 'Cinzel', serif;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${primaryColor};
      margin-bottom: 4px;
    }
    .t-modular .course-desc {
      font-size: 15px;
      line-height: 1.4;
      font-style: italic;
      color: #3f3f46;
      max-width: 680px;
      margin: 0 auto;
    }
    .t-modular .meta-zone {
      font-family: 'Cinzel', serif;
      font-size: 11px;
      color: #71717a;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .t-modular .footer-zone {
      width: 100%;
      margin-top: auto;
      padding-bottom: 10px;
    }
    .t-modular .footer-zone.footer-badge-only {
      display: flex;
      justify-content: center;
    }
    .t-modular .footer-zone.footer-one-sig {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
    }
    .t-modular .footer-zone.footer-one-sig-centered {
      display: flex;
      justify-content: center;
    }
    .t-modular .footer-zone.footer-two-sig {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: flex-end;
      gap: 24px;
    }
    .t-modular .footer-zone.footer-three-sig {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: flex-end;
      gap: 16px;
      position: relative;
    }
    .t-modular .badge-above-three {
      position: absolute;
      top: -90px;
      left: 50%;
      transform: translateX(-50%);
    }
    .t-modular .badge-custom-wrap {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .t-modular .badge-custom-wrap .modular-seal,
    .t-modular .badge-custom-wrap .modular-ribbon,
    .t-modular .badge-custom-wrap .modular-stamp,
    .t-modular .badge-custom-wrap .modular-custom-seal,
    .t-modular .badge-custom-wrap .modular-org-logo-seal {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .t-modular .modular-org-logo-seal {
      width: 108px;
      height: 108px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .t-modular .org-logo-seal-inner {
      width: 108px;
      height: 108px;
      border-radius: 50%;
      border: 3px solid ${foilColor};
      box-shadow: 0 0 0 2px #ffffff, 0 4px 12px rgba(0, 0, 0, 0.12);
      box-sizing: border-box;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 8px;
    }
    .t-modular .badge-custom-wrap .org-logo-seal-inner {
      width: 100%;
      height: 100%;
    }
    .t-modular .org-logo-seal-inner img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .t-modular .badge-custom-wrap svg,
    .t-modular .badge-custom-wrap img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .t-modular [data-position-mode="custom"] {
      box-sizing: border-box;
    }
    .t-modular .sig-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .t-modular .sig-col {
      width: 220px;
      text-align: center;
    }
    .t-modular .sig-img-wrap {
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .t-modular .sig-img {
      max-height: 38px;
    }
    .t-modular .sig-spacer {
      height: 38px;
    }
    .t-modular .sig-line {
      border-top: 1.5px solid;
      margin-bottom: 6px;
    }
    .t-modular .sig-name {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.2;
    }
    .t-modular .sig-role {
      font-family: 'Cinzel', serif;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-top: 2px;
    }
    .t-modular .badge-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 110px;
    }
    .t-modular .modular-qr {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(2px);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .t-modular .modular-qr.pos-bottom-right {
      bottom: ${innerPad + 12}px;
      right: ${innerPad + 16}px;
    }
    .t-modular .modular-qr.pos-bottom-left {
      bottom: ${innerPad + 12}px;
      left: ${innerPad + 16}px;
    }
    .t-modular .modular-qr.pos-center-footer,
    .t-modular .modular-qr.pos-center {
      bottom: ${innerPad + 12}px;
      left: 50%;
      transform: translateX(-50%);
    }
    .t-modular .modular-qr.pos-top-right {
      top: ${innerPad + 12}px;
      right: ${innerPad + 16}px;
    }
    .t-modular .qr-box {
      width: 44px;
      height: 44px;
    }
    .t-modular .qr-info {
      text-align: left;
      display: flex;
      flex-direction: column;
    }
    .t-modular .qr-label {
      font-family: 'Cinzel', serif;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #71717a;
    }
    .t-modular .qr-id {
      font-family: monospace;
      font-size: 10px;
      font-weight: 700;
      color: #18181b;
    }
  `;

  return { body, styles };
};
