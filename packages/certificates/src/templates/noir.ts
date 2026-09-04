import { CERTIFICATE_WIDTH } from '../constants';
import { CERTIFICATE_FONTS } from '../font-metrics';
import {
  escapeHtml,
  prepareCertificateRenderContext,
  renderSealBlock,
  renderSignatoryBlock,
  shadeColor,
  type TemplateRenderer
} from './shared';

const FONTS = {
  display: CERTIFICATE_FONTS.bodoniModa,
  serif: CERTIFICATE_FONTS.cormorantGaramond,
  heading: CERTIFICATE_FONTS.cinzel
} as const;

const subtitleDecorationLineWidth = 50;
const subtitleDecorationGap = 14;
const subtitleTotalDecorationWidth = (subtitleDecorationLineWidth + subtitleDecorationGap) * 2;
const certPadding = 55;
const recipientPaddingBottom = 14;
const medalWidth = 108;
const footerGap = 30;
const signatoryColumnWidth = (CERTIFICATE_WIDTH - certPadding * 2 - footerGap * 2 - medalWidth) / 2;

const FIELDS = {
  org: {
    maxWidth: 420,
    maxHeight: 48,
    fontFamily: FONTS.heading,
    basePx: 13,
    allowWrap: false,
    letterSpacingEm: 0.45,
    textTransform: 'uppercase' as const
  },
  certId: {
    maxWidth: 220,
    maxHeight: 18,
    fontFamily: FONTS.heading,
    basePx: 11,
    allowWrap: false,
    letterSpacingEm: 0.18,
    textTransform: 'uppercase' as const
  },
  date: {
    maxWidth: 220,
    maxHeight: 18,
    fontFamily: FONTS.heading,
    basePx: 11,
    allowWrap: false,
    letterSpacingEm: 0.18,
    textTransform: 'uppercase' as const
  },
  title: {
    maxWidth: 860,
    maxHeight: 120,
    fontFamily: FONTS.display,
    basePx: 62,
    lineHeight: 1.15,
    fontStyle: 'italic' as const,
    fontWeight: 400 as const,
    allowWrap: true
  },
  subtitle: {
    maxWidth: 800 - subtitleTotalDecorationWidth,
    maxHeight: 34,
    fontFamily: FONTS.heading,
    basePx: 13,
    allowWrap: false,
    letterSpacingEm: 0.35,
    textTransform: 'uppercase' as const
  },
  recipient: {
    maxWidth: 820,
    maxHeight: 86 - recipientPaddingBottom,
    fontFamily: FONTS.display,
    basePx: 54,
    lineHeight: 1.05,
    allowWrap: true
  },
  description: {
    maxWidth: 780,
    maxHeight: 64,
    fontFamily: FONTS.serif,
    basePx: 16,
    lineHeight: 1.45,
    fontStyle: 'italic' as const,
    allowWrap: true
  },
  signatoryName: {
    maxWidth: signatoryColumnWidth,
    maxHeight: 28,
    fontFamily: FONTS.display,
    basePx: 18,
    fontStyle: 'italic' as const,
    allowWrap: false
  },
  signatoryRole: {
    maxWidth: signatoryColumnWidth,
    maxHeight: 26,
    fontFamily: FONTS.heading,
    basePx: 10,
    lineHeight: 1.2,
    letterSpacingEm: 0.25,
    allowWrap: true,
    textTransform: 'uppercase' as const
  }
} as const;

export const renderNoir: TemplateRenderer = ({ design, data }) => {
  const { accent, subtitle, description, signatoryOne, signatoryTwo, year, fontSizes, roleMinHeight } =
    prepareCertificateRenderContext(design, data, FIELDS);

  const accentDeep = shadeColor(accent, -30);

  const body = `
    <div class="cert t-noir">
      <div class="cert-content">
        <div class="header-group">
          <div class="top">
            <div class="top-side left">
              <span class="cert-id" style="font-size: ${fontSizes.certId}px;">${escapeHtml(data.certificateId)}</span>
              <div class="line"></div>
            </div>
            <span class="org-name" style="font-size: ${fontSizes.org}px;">${escapeHtml(data.orgName)}</span>
            <div class="top-side right">
              <div class="line"></div>
              <span class="cert-date" style="font-size: ${fontSizes.date}px;">${escapeHtml(data.date)}</span>
            </div>
          </div>
          <div class="crest">&#10022; &#10022; &#10022;</div>
          <div class="title" style="font-size: ${fontSizes.title}px;">${escapeHtml(data.courseName)}</div>
          ${
            subtitle
              ? `<div class="title-line">
                  <div class="l"></div>
                  <span style="font-size: ${fontSizes.subtitle}px;">${escapeHtml(subtitle)}</span>
                  <div class="l"></div>
                </div>`
              : ''
          }
        </div>

        <div class="body-group">
          <div class="presented">presented to</div>
          <div class="recipient" style="font-size: ${fontSizes.recipient}px;">${escapeHtml(data.recipientName)}</div>
          ${description ? `<div class="description" style="font-size: ${fontSizes.description}px;">${escapeHtml(description)}</div>` : ''}
        </div>

        <div class="footer">
          ${renderSignatoryBlock(signatoryOne, { wrapperClass: 'sig', nameClass: 'name', roleClass: 'label' })}
          ${renderSealBlock({ wrapperClass: 'medal', year, label: '★ AWARD ★' })}
          ${renderSignatoryBlock(signatoryTwo, { wrapperClass: 'sig', nameClass: 'name', roleClass: 'label' })}
        </div>
      </div>
    </div>
  `;

  const styles = `
    .t-noir {
      background: #0e0e0e;
      color: #f5f1e8;
      padding: ${certPadding}px;
      font-family: '${FONTS.serif}', serif;
      background-image:
        radial-gradient(circle at 30% 20%, ${accent}14, transparent 50%),
        radial-gradient(circle at 70% 80%, ${accent}0c, transparent 50%);
    }
    .t-noir::before {
      content: '';
      position: absolute;
      inset: 24px;
      border: 1px solid ${accent}66;
      pointer-events: none;
    }
    .t-noir::after {
      content: '';
      position: absolute;
      inset: 34px;
      border: 1px solid ${accent}33;
      pointer-events: none;
    }
    .t-noir .cert-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .t-noir .header-group {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      flex-shrink: 0;
      padding-top: 6px;
    }
    .t-noir .top {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 16px;
      font-family: '${FIELDS.org.fontFamily}', serif;
      color: ${accent};
      text-transform: ${FIELDS.org.textTransform};
      margin-top: 52px;
    }
    .t-noir .top-side {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .t-noir .top-side.left {
      justify-content: flex-start;
    }
    .t-noir .top-side.right {
      justify-content: flex-end;
    }
    .t-noir .top-side .line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, ${accent}, transparent);
    }
    .t-noir .top-side.left .line {
      margin-left: 16px;
    }
    .t-noir .top-side.right .line {
      margin-right: 16px;
    }
    .t-noir .cert-id {
      letter-spacing: ${FIELDS.certId.letterSpacingEm}em;
      max-width: ${FIELDS.certId.maxWidth}px;
      max-height: ${FIELDS.certId.maxHeight}px;
      overflow-wrap: break-word;
      text-align: left;
      flex-shrink: 0;
    }
    .t-noir .org-name {
      letter-spacing: ${FIELDS.org.letterSpacingEm}em;
      max-width: ${FIELDS.org.maxWidth}px;
      max-height: ${FIELDS.org.maxHeight}px;
      overflow-wrap: break-word;
      text-align: center;
    }
    .t-noir .cert-date {
      letter-spacing: ${FIELDS.date.letterSpacingEm}em;
      max-width: ${FIELDS.date.maxWidth}px;
      max-height: ${FIELDS.date.maxHeight}px;
      overflow-wrap: break-word;
      text-align: right;
      flex-shrink: 0;
    }
    .t-noir .crest {
      font-family: '${FONTS.heading}', serif;
      text-align: center;
      color: ${accent};
      margin-top: 20px;
      font-size: 32px;
      letter-spacing: 0.3em;
    }
    .t-noir .title {
      text-align: center;
      font-family: '${FIELDS.title.fontFamily}', serif;
      font-weight: ${FIELDS.title.fontWeight};
      font-style: ${FIELDS.title.fontStyle};
      line-height: ${FIELDS.title.lineHeight};
      color: #f5f1e8;
      max-width: ${FIELDS.title.maxWidth}px;
      max-height: ${FIELDS.title.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-noir .title-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${subtitleDecorationGap}px;
      margin-top: 4px;
      max-width: ${FIELDS.subtitle.maxWidth + subtitleTotalDecorationWidth}px;
      max-height: ${FIELDS.subtitle.maxHeight}px;
    }
    .t-noir .title-line .l {
      width: ${subtitleDecorationLineWidth}px;
      height: 1px;
      background: ${accent};
    }
    .t-noir .title-line span {
      font-family: '${FIELDS.subtitle.fontFamily}', serif;
      letter-spacing: ${FIELDS.subtitle.letterSpacingEm}em;
      color: ${accent};
      text-transform: ${FIELDS.subtitle.textTransform};
      max-width: ${FIELDS.subtitle.maxWidth}px;
      overflow-wrap: break-word;
    }
    .t-noir .body-group {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
      z-index: 1;
      padding: 4px 0;
    }
    .t-noir .presented {
      text-align: center;
      font-style: italic;
      font-size: 16px;
      color: #c9b88c;
      margin-bottom: 4px;
    }
    .t-noir .recipient {
      box-sizing: content-box;
      text-align: center;
      font-family: '${FIELDS.recipient.fontFamily}', serif;
      font-weight: 400;
      color: ${accent};
      margin-top: 6px;
      margin-bottom: 8px;
      width: 100%;
      border-bottom: 2px solid ${accent}66;
      padding-bottom: ${recipientPaddingBottom}px;
      line-height: ${FIELDS.recipient.lineHeight};
      max-width: ${FIELDS.recipient.maxWidth}px;
      max-height: ${FIELDS.recipient.maxHeight + recipientPaddingBottom}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-noir .description {
      text-align: center;
      font-family: '${FIELDS.description.fontFamily}', serif;
      font-style: ${FIELDS.description.fontStyle};
      color: #c9b88c;
      margin-top: 6px;
      line-height: ${FIELDS.description.lineHeight};
      max-width: ${FIELDS.description.maxWidth}px;
      max-height: ${FIELDS.description.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-noir .footer {
      flex-shrink: 0;
      margin-top: auto;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: ${footerGap}px;
      position: relative;
      z-index: 1;
      margin-bottom: 52px;
    }
    .t-noir .sig {
      width: 100%;
      text-align: center;
      border-top: 1px solid ${accent};
      padding-top: 4px;
    }
    .t-noir .sig .name {
      font-family: '${FIELDS.signatoryName.fontFamily}', serif;
      font-size: ${fontSizes.signatoryName}px;
      font-style: ${FIELDS.signatoryName.fontStyle};
      color: #f5f1e8;
      min-height: ${FIELDS.signatoryName.maxHeight}px;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: ${signatoryColumnWidth}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-noir .sig .label {
      font-family: '${FIELDS.signatoryRole.fontFamily}', serif;
      font-size: ${fontSizes.signatoryRole}px;
      line-height: ${FIELDS.signatoryRole.lineHeight};
      letter-spacing: ${FIELDS.signatoryRole.letterSpacingEm}em;
      color: ${accent};
      text-transform: ${FIELDS.signatoryRole.textTransform};
      margin-top: 4px;
      max-width: ${signatoryColumnWidth}px;
      min-height: ${roleMinHeight}px;
      max-height: ${FIELDS.signatoryRole.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-noir .medal {
      align-self: center;
      width: ${medalWidth}px;
      height: ${medalWidth}px;
      border-radius: 50%;
      background: radial-gradient(circle, ${accent} 0%, ${accentDeep} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #0e0e0e;
      box-shadow: 0 0 24px ${accent}4d;
      position: relative;
      flex-shrink: 0;
      margin: 0 auto;
    }
    .t-noir .medal::before {
      content: '';
      position: absolute;
      inset: 5px;
      border: 1px dashed #0e0e0e;
      border-radius: 50%;
    }
    .t-noir .medal .yr {
      font-family: '${FONTS.heading}', serif;
      font-size: 17px;
      font-weight: 600;
      margin-top: 2px;
      line-height: 1;
    }
    .t-noir .medal .lbl {
      font-family: '${FONTS.heading}', serif;
      font-size: 8px;
      letter-spacing: 0.15em;
      margin-top: 2px;
      line-height: 1;
    }
  `;

  return { body, styles };
};
