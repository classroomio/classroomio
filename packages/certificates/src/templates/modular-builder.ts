import { CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT } from '../constants';
import {
  escapeHtml,
  getYear,
  getPositionalSignatories,
  type TemplateRenderer,
  type TemplateRenderArgs,
  type TemplateRenderOutput
} from './shared';

export const renderModular: TemplateRenderer = ({ design, data }: TemplateRenderArgs): TemplateRenderOutput => {
  const [signatoryOne, signatoryTwo] = getPositionalSignatories(design.signatories);
  const border = design.border ?? {};
  const typography = design.typography ?? {};
  const background = design.background ?? {};
  const badge = design.badge ?? {};
  const qrCode = design.qrCode ?? { enabled: true, position: 'bottom_right' };

  const primaryColor = border.primaryColor || design.accentColor || '#d4af37';
  const cornerAccent = border.accentColor || primaryColor;
  const borderWidth = border.width ?? 12;
  const borderStyle = border.style ?? 'victorian';

  const titleFont = typography.titleFont || 'Bodoni Moda';
  const recipientFont = typography.recipientFont || 'Great Vibes';
  const bodyFont = typography.bodyFont || 'Cormorant Garamond';
  const textColor = typography.primaryColor || '#1a1a2e';
  const letterSpacing = typography.letterSpacing ?? 0.05;

  const bgStyle = background.style ?? 'parchment';
  const bgPrimary = background.primaryColor || (bgStyle === 'parchment' ? '#FAF8F2' : '#FFFFFF');
  const bgSecondary = background.secondaryColor || '#F3EDE0';

  const badgeStyle = badge.style ?? 'gold_seal';
  const badgeLabel = escapeHtml(badge.label || 'OFFICIAL SEAL');
  const foilColor = badge.foilColor || primaryColor;

  const year = getYear(data.date);
  const orgName = escapeHtml(data.orgName || 'ACME UNIVERSITY');
  const title = escapeHtml(data.labels?.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT');
  const subtitle = escapeHtml(design.subtitle || 'PROUDLY PRESENTED TO');
  const recipient = escapeHtml(data.recipientName || 'Jane Doe');
  const description = escapeHtml(
    design.descriptionOverride ||
      data.courseDescription ||
      'For successfully mastering Fullstack Engineering and demonstrating leadership and academic rigor.'
  );
  const dateStr = escapeHtml(data.date);
  const certId = escapeHtml(data.certificateId);

  // Background SVG element
  let bgSvg = '';
  if (bgStyle === 'parchment') {
    bgSvg = `
      <rect width="100%" height="100%" fill="${bgPrimary}"/>
      <radialGradient id="parchment-grad" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3"/>
        <stop offset="80%" stop-color="${bgSecondary}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${bgSecondary}" stop-opacity="0.85"/>
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

  if (borderStyle === 'victorian') {
    borderSvg = `
      <!-- Victorian Outer & Inner Rules -->
      <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="3"/>
      <rect x="${pad + 6}" y="${pad + 6}" width="${w - (pad + 6) * 2}" height="${h - (pad + 6) * 2}" fill="none" stroke="${primaryColor}" stroke-width="1" stroke-dasharray="4,2"/>
      <rect x="${innerPad}" y="${innerPad}" width="${w - innerPad * 2}" height="${h - innerPad * 2}" fill="none" stroke="${cornerAccent}" stroke-width="1.5"/>
      
      <!-- Victorian Corner Ornaments (SVG Paths) -->
      <!-- Top Left -->
      <g transform="translate(${pad + 8}, ${pad + 8})">
        <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
        <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
        <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
      </g>
      <!-- Top Right -->
      <g transform="translate(${w - pad - 8}, ${pad + 8}) scale(-1, 1)">
        <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
        <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
        <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
      </g>
      <!-- Bottom Left -->
      <g transform="translate(${pad + 8}, ${h - pad - 8}) scale(1, -1)">
        <path d="M 0,0 L 40,0 C 25,10 15,20 12,38 L 8,38 C 7,20 18,10 0,0 Z" fill="${cornerAccent}"/>
        <circle cx="20" cy="20" r="5" fill="${primaryColor}"/>
        <path d="M 5,28 Q 28,28 28,5" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
      </g>
      <!-- Bottom Right -->
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
      <!-- Corner squares -->
      <rect x="${pad + 4}" y="${pad + 4}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
      <rect x="${w - pad - 20}" y="${pad + 4}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
      <rect x="${pad + 4}" y="${h - pad - 20}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
      <rect x="${w - pad - 20}" y="${h - pad - 20}" width="16" height="16" fill="${cornerAccent}" opacity="0.9"/>
    `;
  } else if (borderStyle === 'geometric') {
    borderSvg = `
      <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="3"/>
      <!-- Stepped corner brackets -->
      <path d="M ${pad + 4},${pad + 24} L ${pad + 24},${pad + 24} L ${pad + 24},${pad + 4}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
      <path d="M ${w - pad - 4},${pad + 24} L ${w - pad - 24},${pad + 24} L ${w - pad - 24},${pad + 4}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
      <path d="M ${pad + 4},${h - pad - 24} L ${pad + 24},${h - pad - 24} L ${pad + 24},${h - pad - 24}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
      <path d="M ${w - pad - 4},${h - pad - 24} L ${w - pad - 24},${h - pad - 24} L ${w - pad - 24},${h - pad - 24}" fill="none" stroke="${cornerAccent}" stroke-width="2"/>
    `;
  } else if (borderStyle === 'minimal') {
    borderSvg = `
      <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${primaryColor}" stroke-width="1.5"/>
    `;
  } else if (borderStyle === 'custom_svg' && border.customSvg) {
    borderSvg = border.customSvg;
  }

  // Badge SVG
  let badgeSvg = '';
  if (badgeStyle === 'gold_seal') {
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
          <!-- 32-point starburst -->
          <circle cx="60" cy="60" r="54" fill="url(#seal-grad)" stroke="${foilColor}" stroke-width="2"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3,2"/>
          <circle cx="60" cy="60" r="42" fill="none" stroke="#85581A" stroke-width="1"/>
          <text x="60" y="55" font-family="'Cinzel', serif" font-size="8" font-weight="700" fill="#3a2515" text-anchor="middle" letter-spacing="1">
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
          <!-- Ribbon tails -->
          <polygon points="25,65 15,120 35,105 45,70" fill="#6E440D" opacity="0.85"/>
          <polygon points="75,65 85,120 65,105 55,70" fill="#6E440D" opacity="0.85"/>
          <!-- Medallion -->
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

  // QR Code SVG
  const qrSvg = qrCode.enabled
    ? `
      <div class="modular-qr">
        <div class="qr-box">
          <svg viewBox="0 0 48 48" width="44" height="44" fill="${textColor}">
            <!-- Stylized QR Matrix representation -->
            <rect x="2" y="2" width="14" height="14" fill="none" stroke="${textColor}" stroke-width="2.5"/>
            <rect x="6" y="6" width="6" height="6" fill="${textColor}"/>
            <rect x="32" y="2" width="14" height="14" fill="none" stroke="${textColor}" stroke-width="2.5"/>
            <rect x="36" y="6" width="6" height="6" fill="${textColor}"/>
            <rect x="2" y="32" width="14" height="14" fill="none" stroke="${textColor}" stroke-width="2.5"/>
            <rect x="6" y="36" width="6" height="6" fill="${textColor}"/>
            <rect x="20" y="4" width="8" height="4" fill="${textColor}"/>
            <rect x="4" y="20" width="4" height="8" fill="${textColor}"/>
            <rect x="22" y="22" width="6" height="6" fill="${textColor}"/>
            <rect x="32" y="24" width="12" height="4" fill="${textColor}"/>
            <rect x="24" y="34" width="6" height="10" fill="${textColor}"/>
            <rect x="36" y="36" width="8" height="8" fill="${textColor}"/>
          </svg>
        </div>
        <div class="qr-info">
          <span class="qr-label">VERIFIED CREDENTIAL</span>
          <span class="qr-id">${certId}</span>
        </div>
      </div>
    `
    : '';

  // Signatories block
  const sigOneHtml = signatoryOne
    ? `
      <div class="sig-col">
        ${
          signatoryOne.signatureUrl
            ? `<div class="sig-img-wrap"><img src="${escapeHtml(signatoryOne.signatureUrl)}" alt="Signature" class="sig-img"/></div>`
            : `<div class="sig-spacer"></div>`
        }
        <div class="sig-line" style="border-top-color: ${primaryColor};"></div>
        <div class="sig-name" style="font-family: '${bodyFont}', serif;">${escapeHtml(signatoryOne.name)}</div>
        <div class="sig-role" style="color: ${primaryColor};">${escapeHtml(signatoryOne.role)}</div>
      </div>
    `
    : `<div class="sig-col"></div>`;

  const sigTwoHtml = signatoryTwo
    ? `
      <div class="sig-col">
        ${
          signatoryTwo.signatureUrl
            ? `<div class="sig-img-wrap"><img src="${escapeHtml(signatoryTwo.signatureUrl)}" alt="Signature" class="sig-img"/></div>`
            : `<div class="sig-spacer"></div>`
        }
        <div class="sig-line" style="border-top-color: ${primaryColor};"></div>
        <div class="sig-name" style="font-family: '${bodyFont}', serif;">${escapeHtml(signatoryTwo.name)}</div>
        <div class="sig-role" style="color: ${primaryColor};">${escapeHtml(signatoryTwo.role)}</div>
      </div>
    `
    : `<div class="sig-col"></div>`;

  const body = `
    <div class="cert t-modular" style="color: ${textColor};">
      <svg class="modular-bg-svg" width="${CERTIFICATE_WIDTH}" height="${CERTIFICATE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        ${bgSvg}
        ${borderSvg}
      </svg>

      <div class="modular-content">
        <!-- Header / Org -->
        <div class="header-zone">
          <div class="org-name" style="color: ${primaryColor}; letter-spacing: 0.3em;">${orgName}</div>
        </div>

        <!-- Main Title & Subtitle -->
        <div class="title-zone">
          <h1 class="main-title" style="font-family: '${titleFont}', serif; letter-spacing: ${letterSpacing}em;">
            ${title}
          </h1>
          <div class="subtitle" style="color: ${primaryColor}; letter-spacing: 0.25em;">
            ${subtitle}
          </div>
        </div>

        <!-- Recipient -->
        <div class="recipient-zone">
          <div class="recipient-name" style="font-family: '${recipientFont}', cursive, serif;">
            ${recipient}
          </div>
          <div class="recipient-rule" style="background-color: ${primaryColor};"></div>
        </div>

        <!-- Course & Description -->
        <div class="course-zone">
          <div class="course-name" style="font-family: '${titleFont}', serif;">
            ${escapeHtml(data.courseName)}
          </div>
          <div class="course-desc" style="font-family: '${bodyFont}', serif;">
            ${description}
          </div>
        </div>

        <!-- Meta / Date -->
        <div class="meta-zone">
          <div class="meta-date">Date of Conferment: <strong>${dateStr}</strong></div>
        </div>

        <!-- Footer / Signatures, Seal, QR -->
        <div class="footer-zone">
          <div class="sig-container">
            ${sigOneHtml}
          </div>

          <div class="badge-container">
            ${badgeSvg}
          </div>

          <div class="sig-container">
            ${sigTwoHtml}
          </div>
        </div>

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
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: flex-end;
      gap: 24px;
      margin-top: auto;
      padding-bottom: 10px;
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
      bottom: ${innerPad + 12}px;
      right: ${innerPad + 16}px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(2px);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,0.06);
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
