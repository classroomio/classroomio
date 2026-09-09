import { CERTIFICATE_FONTS } from '../font-metrics';
import {
  escapeHtml,
  prepareCertificateRenderContext,
  renderFooterMetaBlock,
  renderSignatoryBlock,
  type TemplateRenderer
} from './shared';

const FONTS = {
  display: CERTIFICATE_FONTS.playfairDisplay,
  mono: CERTIFICATE_FONTS.jetbrainsMono,
  sans: CERTIFICATE_FONTS.spaceGrotesk
} as const;

const orgPillPaddingHorizontal = 12;
const orgPillPaddingVertical = 5;
const recipientBoxPaddingHorizontal = 30;
const recipientBoxPaddingVertical = 24;
const descriptionPaddingBottom = 8;
const bottomGridMaxWidth = 780;
const bottomGridGap = 30;
const bottomGridColumnWidth = (bottomGridMaxWidth - bottomGridGap * 2) / 3;

const FIELDS = {
  org: {
    maxWidth: 480 - orgPillPaddingHorizontal * 2,
    maxHeight: 35 - orgPillPaddingVertical * 2,
    fontFamily: FONTS.mono,
    basePx: 11,
    allowWrap: false,
    letterSpacingEm: 0.2,
    textTransform: 'uppercase' as const
  },
  certMeta: {
    maxWidth: 450,
    maxHeight: 25,
    fontFamily: FONTS.mono,
    basePx: 11,
    allowWrap: false,
    letterSpacingEm: 0.2,
    textTransform: 'uppercase' as const
  },
  title: {
    maxWidth: 880,
    maxHeight: 240,
    fontFamily: FONTS.display,
    basePx: 140,
    lineHeight: 0.95,
    letterSpacingEm: -0.03,
    allowWrap: true,
    fontWeight: 900 as const
  },
  subtitle: {
    maxWidth: 800,
    maxHeight: 40,
    fontFamily: FONTS.display,
    basePx: 32,
    lineHeight: 1.0,
    fontStyle: 'italic' as const,
    allowWrap: false
  },
  recipient: {
    maxWidth: 680 - recipientBoxPaddingHorizontal * 2,
    maxHeight: 58,
    fontFamily: FONTS.display,
    basePx: 54,
    lineHeight: 1.0,
    allowWrap: true,
    fontWeight: 700 as const
  },
  description: {
    maxWidth: 720,
    maxHeight: 40 - descriptionPaddingBottom,
    fontFamily: FONTS.sans,
    basePx: 15,
    lineHeight: 1.55,
    allowWrap: true
  },
  footerValue: {
    maxWidth: bottomGridColumnWidth,
    maxHeight: 52,
    fontFamily: FONTS.display,
    basePx: 22,
    lineHeight: 1.1,
    allowWrap: true,
    fontWeight: 700 as const
  },
  signatoryRole: {
    maxWidth: bottomGridColumnWidth,
    maxHeight: 24,
    fontFamily: FONTS.mono,
    basePx: 9,
    lineHeight: 1.2,
    letterSpacingEm: 0.2,
    allowWrap: true,
    textTransform: 'uppercase' as const
  }
} as const;

export const renderPoster: TemplateRenderer = ({ design, data }) => {
  const certMeta = `${data.certificateId} / ${data.date}`;
  const { accent, subtitle, description, signatoryOne, signatoryTwo, year, fontSizes, roleMinHeight } =
    prepareCertificateRenderContext(design, data, FIELDS, {
      certMeta
    });

  const [firstTitleWord, ...restTitleWords] = data.courseName.split(' ');
  const titleEmphasis = restTitleWords.join(' ');

  const body = `
    <div class="cert t-poster">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="content">
        <div class="main-section">
          <div class="top">
            <span class="pill" style="font-size: ${fontSizes.org}px;">${escapeHtml(data.orgName)}</span>
            <span class="cert-meta" style="font-size: ${fontSizes.certMeta}px;">${escapeHtml(certMeta)}</span>
          </div>
          <div class="title-area">
            <div class="title" style="font-size: ${fontSizes.title}px;">${escapeHtml(firstTitleWord || 'Award')}${titleEmphasis ? ` <em>${escapeHtml(titleEmphasis)}</em>` : ''}</div>
            ${subtitle ? `<div class="subtitle" style="font-size: ${fontSizes.subtitle}px;">${escapeHtml(subtitle)}</div>` : ''}
          </div>
          <div class="recipient-box">
            <div class="lbl">Awarded To</div>
            <div class="recipient" style="font-size: ${fontSizes.recipient}px;">${escapeHtml(data.recipientName)}</div>
          </div>
          ${description ? `<div class="description" style="font-size: ${fontSizes.description}px;">${escapeHtml(description)}</div>` : ''}
        </div>

        <div class="footer-section">
          <div class="bottom-grid">
            ${renderSignatoryBlock(signatoryOne, { nameClass: 'v', roleClass: 'k', roleFirst: true })}
            ${renderSignatoryBlock(signatoryTwo, { nameClass: 'v', roleClass: 'k', roleFirst: true })}
            ${renderFooterMetaBlock('Issued', data.date, { labelClass: 'k', valueClass: 'v' })}
          </div>
          <div class="corner-num">${escapeHtml(year)}</div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .t-poster {
      background: #fef2dc;
      color: #1a1a1a;
      padding: 0;
      font-family: '${FONTS.sans}', sans-serif;
      overflow: hidden;
    }
    .t-poster .blob {
      position: absolute;
      border-radius: 50%;
    }
    .t-poster .blob-1 {
      background: ${accent};
      width: 520px;
      height: 520px;
      top: -140px;
      right: -80px;
      opacity: 0.92;
    }
    .t-poster .blob-2 {
      background: #2563eb;
      width: 440px;
      height: 440px;
      bottom: -160px;
      left: -120px;
      opacity: 0.95;
    }
    .t-poster .blob-3 {
      background: #f59e0b;
      width: 200px;
      height: 200px;
      top: 44%;
      left: 58%;
      opacity: 0.92;
    }
    .t-poster .content {
      position: relative;
      z-index: 2;
      height: 100%;
      padding: 50px 55px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .t-poster .main-section {
      display: flex;
      flex-direction: column;
    }
    .t-poster .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: '${FONTS.mono}', monospace;
      text-transform: uppercase;
      margin-bottom: 20px;
      flex-shrink: 0;
    }
    .t-poster .top .pill {
      background: ${accent};
      color: #fef2dc;
      padding: ${orgPillPaddingVertical}px ${orgPillPaddingHorizontal}px;
      border-radius: 100px;
      font-weight: 500;
      font-size: ${fontSizes.org}px;
      letter-spacing: ${FIELDS.org.letterSpacingEm}em;
      max-width: ${FIELDS.org.maxWidth + orgPillPaddingHorizontal * 2}px;
      max-height: ${FIELDS.org.maxHeight + orgPillPaddingVertical * 2}px;
      overflow-wrap: break-word;
    }
    .t-poster .cert-meta {
      font-size: ${fontSizes.certMeta}px;
      font-weight: 500;
      color: #1a1a1a;
      letter-spacing: ${FIELDS.certMeta.letterSpacingEm}em;
      max-width: ${FIELDS.certMeta.maxWidth}px;
      max-height: ${FIELDS.certMeta.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-poster .title-area {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }
    .t-poster .title {
      font-family: '${FIELDS.title.fontFamily}', serif;
      font-weight: ${FIELDS.title.fontWeight};
      line-height: ${FIELDS.title.lineHeight};
      letter-spacing: ${FIELDS.title.letterSpacingEm}em;
      color: #1a1a1a;
      margin-bottom: 20px;
      max-width: ${FIELDS.title.maxWidth}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-poster .title em {
      font-style: italic;
      font-weight: 400;
      color: ${accent};
    }
    .t-poster .subtitle {
      font-family: '${FIELDS.subtitle.fontFamily}', serif;
      font-style: ${FIELDS.subtitle.fontStyle};
      font-weight: 400;
      line-height: ${FIELDS.subtitle.lineHeight};
      margin-bottom: 30px;
      color: #1a1a1a;
      max-width: ${FIELDS.subtitle.maxWidth}px;
      overflow-wrap: break-word;
    }
    .t-poster .recipient-box {
      flex-shrink: 0;
      background: ${accent};
      color: #fef2dc;
      padding: ${recipientBoxPaddingVertical}px ${recipientBoxPaddingHorizontal}px;
      align-self: flex-start;
      max-width: ${FIELDS.recipient.maxWidth + recipientBoxPaddingHorizontal * 2}px;
      transform: rotate(-1deg);
      box-shadow: 8px 8px 0 #1a1a1a;
      margin-bottom: 25px;
    }
    .t-poster .recipient-box .lbl {
      font-family: '${FONTS.mono}', monospace;
      font-size: 10px;
      letter-spacing: 0.22em;
      color: #fef2dc;
      opacity: 0.85;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .t-poster .recipient {
      font-family: '${FIELDS.recipient.fontFamily}', serif;
      font-weight: ${FIELDS.recipient.fontWeight};
      line-height: ${FIELDS.recipient.lineHeight};
      letter-spacing: -0.02em;
      max-width: ${FIELDS.recipient.maxWidth}px;
      max-height: ${FIELDS.recipient.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-poster .description {
      font-family: '${FIELDS.description.fontFamily}', sans-serif;
      line-height: ${FIELDS.description.lineHeight};
      color: #1a1a1a;
      font-weight: 500;
      padding-bottom: ${descriptionPaddingBottom}px;
      max-width: ${FIELDS.description.maxWidth}px;
      max-height: ${FIELDS.description.maxHeight + descriptionPaddingBottom}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-poster .footer-section {
      margin-top: auto;
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 2px solid #1a1a1a;
      padding-top: 18px;
    }
    .t-poster .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: start;
      gap: ${bottomGridGap}px;
      flex: 1;
      max-width: ${bottomGridMaxWidth}px;
      font-family: '${FONTS.mono}', monospace;
    }
    .t-poster .footer-section .sig-content,
    .t-poster .footer-section .sig-text {
      align-items: flex-start;
      text-align: left;
    }
    .t-poster .footer-section .sig-img-slot {
      justify-content: flex-start;
    }
    .t-poster .footer-section .k {
      font-family: '${FIELDS.signatoryRole.fontFamily}', monospace;
      font-size: ${fontSizes.signatoryRole}px;
      line-height: ${FIELDS.signatoryRole.lineHeight};
      letter-spacing: ${FIELDS.signatoryRole.letterSpacingEm}em;
      text-transform: ${FIELDS.signatoryRole.textTransform};
      color: #4a4a4a;
      margin-bottom: 6px;
      max-width: ${bottomGridColumnWidth}px;
      min-height: ${roleMinHeight}px;
      max-height: ${FIELDS.signatoryRole.maxHeight}px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow-wrap: break-word;
    }
    .t-poster .footer-section .v {
      font-family: '${FIELDS.footerValue.fontFamily}', serif;
      font-size: ${fontSizes.footerValue}px;
      font-weight: ${FIELDS.footerValue.fontWeight};
      line-height: ${FIELDS.footerValue.lineHeight};
      color: #1a1a1a;
      max-width: ${bottomGridColumnWidth}px;
      max-height: ${FIELDS.footerValue.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-poster .corner-num {
      font-family: '${FONTS.display}', serif;
      font-size: 80px;
      font-weight: 900;
      font-style: italic;
      color: ${accent};
      line-height: 0.75;
      margin-left: 20px;
      flex-shrink: 0;
    }
  `;

  return { body, styles };
};
