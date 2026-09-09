import { CERTIFICATE_WIDTH } from '../constants';
import { CERTIFICATE_FONTS } from '../font-metrics';
import {
  escapeHtml,
  prepareCertificateRenderContext,
  renderSealBlock,
  renderSignatoryBlock,
  type TemplateRenderer
} from './shared';

const FONTS = {
  display: CERTIFICATE_FONTS.bodoniModa,
  serif: CERTIFICATE_FONTS.cormorantGaramond,
  heading: CERTIFICATE_FONTS.cinzel
} as const;

const certPadding = 55;
const recipientPaddingBottom = 14;
const sealSide = 108;
const footerGap = 30;
const signatoryColumnWidth = (CERTIFICATE_WIDTH - certPadding * 2 - footerGap * 2 - sealSide) / 2;
const sealLabelMaxWidth = 85;

const FIELDS = {
  org: {
    maxWidth: 720,
    maxHeight: 48,
    fontFamily: FONTS.heading,
    basePx: 13,
    allowWrap: false,
    letterSpacingEm: 0.45,
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
    maxWidth: 800,
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
    maxHeight: 80,
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
  },
  sealLabel: {
    maxWidth: sealLabelMaxWidth,
    maxHeight: 14,
    fontFamily: FONTS.heading,
    basePx: 8,
    allowWrap: false,
    letterSpacingEm: 0.15,
    textTransform: 'uppercase' as const
  }
} as const;

export const renderClassique: TemplateRenderer = ({ design, data }) => {
  const { accent, subtitle, description, signatoryOne, signatoryTwo, year, fontSizes, roleMinHeight } =
    prepareCertificateRenderContext(design, data, FIELDS);

  const body = `
    <div class="cert t-classique">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      
      <div class="header-area">
        <div class="top-tag" style="font-size: ${fontSizes.org}px;">${escapeHtml(data.orgName)}</div>
        <div class="ornament">&#10086;</div>
        <div class="title" style="font-size: ${fontSizes.title}px;">${escapeHtml(data.courseName)}</div>
        ${subtitle ? `<div class="subtitle" style="font-size: ${fontSizes.subtitle}px;">${escapeHtml(subtitle)}</div>` : ''}
      </div>

      <div class="body-area">
        <div class="presented">&mdash; this is to certify that &mdash;</div>
        <div class="recipient" style="font-size: ${fontSizes.recipient}px;">${escapeHtml(data.recipientName)}</div>
        ${description ? `<div class="description" style="font-size: ${fontSizes.description}px;">${escapeHtml(description)}</div>` : ''}
      </div>

      <div class="footer">
        ${renderSignatoryBlock(signatoryOne, { wrapperClass: 'sig', nameClass: 'name', roleClass: 'label' })}
        ${renderSealBlock({ year, label: data.certificateId, topSymbol: '★' })}
        ${renderSignatoryBlock(signatoryTwo, { wrapperClass: 'sig', nameClass: 'name', roleClass: 'label' })}
      </div>
    </div>
  `;

  const styles = `
    .t-classique {
      background: #faf6ec;
      color: #2a1810;
      padding: ${certPadding}px;
      font-family: '${FONTS.serif}', serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .t-classique::before {
      content: '';
      position: absolute;
      inset: 24px;
      border: 2px double ${accent};
      pointer-events: none;
    }
    .t-classique::after {
      content: '';
      position: absolute;
      inset: 34px;
      border: 1px solid ${accent};
      pointer-events: none;
    }
    .t-classique .corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 1px solid ${accent};
      pointer-events: none;
    }
    .t-classique .corner.tl { top: 44px; left: 44px; border-right: none; border-bottom: none; }
    .t-classique .corner.tr { top: 44px; right: 44px; border-left: none; border-bottom: none; }
    .t-classique .corner.bl { bottom: 44px; left: 44px; border-right: none; border-top: none; }
    .t-classique .corner.br { bottom: 44px; right: 44px; border-left: none; border-top: none; }
    
    .t-classique .header-area {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
      padding-top: 6px;
    }
    .t-classique .top-tag {
      font-family: '${FIELDS.org.fontFamily}', serif;
      letter-spacing: ${FIELDS.org.letterSpacingEm}em;
      color: ${accent};
      text-transform: ${FIELDS.org.textTransform};
      max-width: ${FIELDS.org.maxWidth}px;
      max-height: ${FIELDS.org.maxHeight}px;
      overflow-wrap: break-word;
      margin-top: 52px;
    }
    .t-classique .ornament {
      font-family: '${FONTS.heading}', serif;
      text-align: center;
      font-size: 18px;
      color: ${accent};
      margin: 2px 0;
    }
    .t-classique .title {
      text-align: center;
      font-family: '${FIELDS.title.fontFamily}', serif;
      font-weight: ${FIELDS.title.fontWeight};
      font-style: ${FIELDS.title.fontStyle};
      line-height: ${FIELDS.title.lineHeight};
      color: #2a1810;
      max-width: ${FIELDS.title.maxWidth}px;
      max-height: ${FIELDS.title.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-classique .subtitle {
      text-align: center;
      font-family: '${FIELDS.subtitle.fontFamily}', serif;
      letter-spacing: ${FIELDS.subtitle.letterSpacingEm}em;
      color: ${accent};
      margin-top: 4px;
      text-transform: ${FIELDS.subtitle.textTransform};
      max-width: ${FIELDS.subtitle.maxWidth}px;
      max-height: ${FIELDS.subtitle.maxHeight}px;
      overflow-wrap: break-word;
    }

    .t-classique .body-area {
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
    .t-classique .presented {
      text-align: center;
      font-style: italic;
      font-size: 16px;
      color: #5a3a25;
      margin-bottom: 4px;
    }
    .t-classique .recipient {
      box-sizing: content-box;
      text-align: center;
      font-family: '${FIELDS.recipient.fontFamily}', serif;
      font-weight: 400;
      margin-top: 6px;
      margin-bottom: 8px;
      width: 100%;
      border-bottom: 2px solid ${accent};
      padding-bottom: ${recipientPaddingBottom}px;
      line-height: ${FIELDS.recipient.lineHeight};
      max-width: ${FIELDS.recipient.maxWidth}px;
      max-height: ${FIELDS.recipient.maxHeight + recipientPaddingBottom}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-classique .description {
      text-align: center;
      font-family: '${FIELDS.description.fontFamily}', serif;
      font-style: ${FIELDS.description.fontStyle};
      color: #3a2515;
      margin-top: 6px;
      line-height: ${FIELDS.description.lineHeight};
      max-width: ${FIELDS.description.maxWidth}px;
      max-height: ${FIELDS.description.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }

    .t-classique .footer {
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
    .t-classique .sig {
      width: 100%;
      text-align: center;
      border-top: 1px solid ${accent};
      padding-top: 4px;
    }
    .t-classique .sig .name {
      font-family: '${FIELDS.signatoryName.fontFamily}', serif;
      font-size: ${fontSizes.signatoryName}px;
      font-style: ${FIELDS.signatoryName.fontStyle};
      min-height: ${FIELDS.signatoryName.maxHeight}px;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: ${signatoryColumnWidth}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-classique .sig .label {
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
    .t-classique .seal {
      align-self: center;
      width: ${sealSide}px;
      height: ${sealSide}px;
      border: 2px solid ${accent};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: ${accent};
      background: radial-gradient(circle, #faf6ec 60%, ${accent}1a);
      position: relative;
      margin: 0 auto;
    }
    .t-classique .seal::before {
      content: '';
      position: absolute;
      inset: 5px;
      border: 1px dashed ${accent};
      border-radius: 50%;
    }
    .t-classique .seal .star { font-size: 18px; line-height: 1; }
    .t-classique .seal .yr {
      font-family: '${FONTS.heading}', serif;
      font-size: 17px;
      font-weight: 600;
      margin-top: 2px;
      line-height: 1;
    }
    .t-classique .seal .lbl {
      font-family: '${FIELDS.sealLabel.fontFamily}', serif;
      font-size: ${fontSizes.sealLabel}px;
      letter-spacing: ${FIELDS.sealLabel.letterSpacingEm}em;
      text-transform: ${FIELDS.sealLabel.textTransform};
      margin-top: 2px;
      line-height: 1;
      max-width: ${FIELDS.sealLabel.maxWidth}px;
      max-height: ${FIELDS.sealLabel.maxHeight}px;
      overflow-wrap: break-word;
    }
  `;

  return { body, styles };
};
