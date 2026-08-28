import { CERTIFICATE_FONTS } from '../font-metrics';
import {
  escapeHtml,
  prepareCertificateRenderContext,
  renderFooterMetaBlock,
  renderSignatoryBlock,
  type TemplateRenderer
} from './shared';

const FONTS = {
  serif: CERTIFICATE_FONTS.cormorantGaramond,
  mono: CERTIFICATE_FONTS.jetbrainsMono,
  sans: CERTIFICATE_FONTS.spaceGrotesk
} as const;

const borderLeftWidth = 12;
const subtitleDecorationLineWidth = 24;
const subtitleDecorationGap = 10;
const subtitleTotalDecorationWidth = (subtitleDecorationLineWidth + subtitleDecorationGap) * 2;
const recipientRowPaddingBottom = 14;
const recipientNumColumnWidth = 120;
const recipientRowGap = 30;

const FIELDS = {
  org: {
    maxWidth: 520,
    maxHeight: 15,
    fontFamily: FONTS.mono,
    basePx: 10,
    allowWrap: false,
    letterSpacingPx: 2,
    textTransform: 'uppercase' as const
  },
  certMeta: {
    maxWidth: 340,
    maxHeight: 15,
    fontFamily: FONTS.mono,
    basePx: 10,
    allowWrap: false,
    textTransform: 'uppercase' as const
  },
  subtitle: {
    maxWidth: 750 - subtitleTotalDecorationWidth,
    maxHeight: 15,
    fontFamily: FONTS.mono,
    basePx: 11,
    allowWrap: false,
    letterSpacingPx: 3,
    textTransform: 'uppercase' as const
  },
  title: {
    maxWidth: 880,
    maxHeight: 140,
    fontFamily: FONTS.serif,
    basePx: 68,
    lineHeight: 1.05,
    allowWrap: true
  },
  recipient: {
    maxWidth: 900 - borderLeftWidth - recipientNumColumnWidth - recipientRowGap,
    maxHeight: 100,
    fontFamily: FONTS.serif,
    basePx: 88,
    lineHeight: 0.95,
    allowWrap: true
  },
  description: {
    maxWidth: 760,
    maxHeight: 80,
    fontFamily: FONTS.sans,
    basePx: 16,
    lineHeight: 1.6,
    allowWrap: true
  }
} as const;

export const renderMinimal: TemplateRenderer = ({ design, data }) => {
  const { accent, subtitle, description, signatoryOne, signatoryTwo, fontSizes } = prepareCertificateRenderContext(
    design,
    data,
    FIELDS
  );

  const body = `
    <div class="cert t-minimal">
      <div class="header-area">
        <div class="top">
          <span class="org-name" style="font-size: ${fontSizes.org}px;">${escapeHtml(data.orgName)}</span>
          <span class="cert-meta" style="font-size: ${fontSizes.certMeta}px;">${escapeHtml(data.certificateId)} &middot; ${escapeHtml(data.date)}</span>
        </div>
        ${subtitle ? `<div class="small" style="font-size: ${fontSizes.subtitle}px;">&mdash; ${escapeHtml(subtitle)} &mdash;</div>` : ''}
        <div class="title" style="font-size: ${fontSizes.title}px;">${escapeHtml(data.courseName)}</div>
      </div>

      <div class="body-area">
        <div class="recipient-row">
          <div class="num">${escapeHtml(data.certificateId)}</div>
          <div class="recipient" style="font-size: ${fontSizes.recipient}px;">${escapeHtml(data.recipientName)}</div>
        </div>
        ${description ? `<div class="description" style="font-size: ${fontSizes.description}px;">${escapeHtml(description)}</div>` : ''}
      </div>

      <div class="footer">
        ${renderSignatoryBlock(signatoryOne, { nameClass: 'v', roleClass: 'k', roleFirst: true })}
        ${renderSignatoryBlock(signatoryTwo, { nameClass: 'v', roleClass: 'k', roleFirst: true })}
        ${renderFooterMetaBlock('Issued', data.date, { labelClass: 'k', valueClass: 'v' })}
        ${renderFooterMetaBlock('Reference', data.certificateId, { wrapperClass: 'ref', labelClass: 'k', valueClass: 'v' })}
      </div>
    </div>
  `;

  const styles = `
    .t-minimal {
      background: #fff;
      color: #0a0a0a;
      padding: 80px 100px;
      font-family: '${FONTS.sans}', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-left: ${borderLeftWidth}px solid ${accent};
    }
    .t-minimal .header-area {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }
    .t-minimal .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: '${FONTS.mono}', monospace;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #999;
      padding-bottom: 20px;
      border-bottom: 1px solid #0a0a0a;
      flex-shrink: 0;
    }
    .t-minimal .org-name {
      max-width: ${FIELDS.org.maxWidth}px;
      max-height: ${FIELDS.org.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-minimal .cert-meta {
      max-width: ${FIELDS.certMeta.maxWidth}px;
      max-height: ${FIELDS.certMeta.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-minimal .small {
      font-family: '${FONTS.mono}', monospace;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${accent};
      display: inline-flex;
      align-items: center;
      gap: ${subtitleDecorationGap}px;
      align-self: flex-start;
      margin-top: 30px;
      margin-bottom: 25px;
      max-width: ${FIELDS.subtitle.maxWidth + subtitleTotalDecorationWidth}px;
      max-height: ${FIELDS.subtitle.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-minimal .small::before {
      content: '';
      width: ${subtitleDecorationLineWidth}px;
      height: 2px;
      background: ${accent};
    }
    .t-minimal .small::after {
      content: '';
      width: ${subtitleDecorationLineWidth}px;
      height: 2px;
      background: ${accent};
    }
    .t-minimal .title {
      font-family: '${FIELDS.title.fontFamily}', serif;
      font-weight: 300;
      font-style: italic;
      line-height: ${FIELDS.title.lineHeight};
      letter-spacing: -0.01em;
      margin-bottom: 50px;
      max-width: ${FIELDS.title.maxWidth}px;
      max-height: ${FIELDS.title.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-minimal .body-area {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .t-minimal .recipient-row {
      display: grid;
      grid-template-columns: ${recipientNumColumnWidth}px 1fr;
      gap: ${recipientRowGap}px;
      align-items: end;
      border-bottom: 2px solid ${accent};
      padding-bottom: ${recipientRowPaddingBottom}px;
      margin-bottom: 14px;
    }
    .t-minimal .recipient-row .num {
      font-family: '${FONTS.mono}', monospace;
      font-size: 14px;
      color: ${accent};
      padding-bottom: ${recipientRowPaddingBottom}px;
      letter-spacing: 0.1em;
      overflow-wrap: break-word;
    }
    .t-minimal .recipient {
      font-family: '${FIELDS.recipient.fontFamily}', serif;
      font-weight: 400;
      line-height: ${FIELDS.recipient.lineHeight};
      letter-spacing: -0.02em;
      max-width: ${FIELDS.recipient.maxWidth}px;
      max-height: ${FIELDS.recipient.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-minimal .description {
      font-family: '${FIELDS.description.fontFamily}', sans-serif;
      line-height: ${FIELDS.description.lineHeight};
      color: #333;
      max-width: ${FIELDS.description.maxWidth}px;
      max-height: ${FIELDS.description.maxHeight}px;
      font-weight: 400;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-minimal .footer {
      flex-shrink: 0;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      align-items: end;
      gap: 30px;
      padding-top: 20px;
      border-top: 1px solid #0a0a0a;
      font-family: '${FONTS.mono}', monospace;
    }
    .t-minimal .footer .sig-content,
    .t-minimal .footer .sig-text {
      align-items: flex-start;
      text-align: left;
    }
    .t-minimal .footer .sig-img-slot {
      justify-content: flex-start;
    }
    .t-minimal .footer .k {
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 4px;
      overflow-wrap: break-word;
    }
    .t-minimal .footer .v {
      font-family: '${FONTS.serif}', serif;
      font-size: 20px;
      font-weight: 500;
      line-height: 1.1;
      overflow-wrap: break-word;
    }
    .t-minimal .footer .ref .k { color: ${accent}; }
    .t-minimal .footer .ref .v { color: ${accent}; }
  `;

  return { body, styles };
};
