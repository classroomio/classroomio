import { CERTIFICATE_WIDTH } from '../constants';
import { CERTIFICATE_FONTS } from '../font-metrics';
import { escapeHtml, prepareCertificateRenderContext, renderSignatoryBlock, type TemplateRenderer } from './shared';

const FONTS = {
  display: CERTIFICATE_FONTS.archivoBlack,
  mono: CERTIFICATE_FONTS.jetbrainsMono
} as const;

const certPaddingHorizontal = 45;
const certPaddingX = certPaddingHorizontal * 2;
const dateRowItemWidth = 180;
const subtitleRowItemWidth = 300;
const courseRowItemWidth = CERTIFICATE_WIDTH - certPaddingX - dateRowItemWidth - subtitleRowItemWidth;
const metaRowCellPaddingHorizontal = 18;
const metaRowCellPaddingVertical = 14;
const metaRowCellPaddingX = metaRowCellPaddingHorizontal * 2;
const metaRowCellPaddingY = metaRowCellPaddingVertical * 2;
const certIdPaddingHorizontal = 10;
const certIdPaddingVertical = 6;
const recipientPaddingLeft = 16;
const numMaxWidth = CERTIFICATE_WIDTH - certPaddingX;
const footerColumnWidth = CERTIFICATE_WIDTH / 2 - certPaddingX;

const metaRowItemData = {
  maxHeight: 73 - metaRowCellPaddingY,
  fontFamily: FONTS.mono,
  basePx: 18,
  lineHeight: 1.15,
  letterSpacingEm: 0.05,
  allowWrap: true,
  textTransform: 'uppercase' as const
};

const FIELDS = {
  org: {
    maxWidth: 550,
    maxHeight: 60,
    fontFamily: FONTS.mono,
    basePx: 11,
    allowWrap: false,
    letterSpacingEm: 0.18,
    textTransform: 'uppercase' as const
  },
  certId: {
    maxWidth: 280 - certIdPaddingHorizontal * 2,
    maxHeight: 60 - certIdPaddingVertical * 2,
    fontFamily: FONTS.mono,
    basePx: 11,
    allowWrap: false,
    textTransform: 'uppercase' as const
  },
  num: {
    maxWidth: numMaxWidth,
    maxHeight: 120,
    fontFamily: FONTS.mono,
    basePx: 120,
    fontWeight: 700 as const,
    allowWrap: false,
    letterSpacingEm: -0.04
  },
  date: {
    maxWidth: dateRowItemWidth - metaRowCellPaddingX,
    ...metaRowItemData
  },
  course: {
    maxWidth: courseRowItemWidth - metaRowCellPaddingX,
    ...metaRowItemData
  },
  subtitle: {
    maxWidth: subtitleRowItemWidth - metaRowCellPaddingX,
    ...metaRowItemData
  },
  recipient: {
    maxWidth: 680 - recipientPaddingLeft,
    maxHeight: 140,
    fontFamily: FONTS.display,
    basePx: 88,
    lineHeight: 0.95,
    letterSpacingEm: -0.03,
    allowWrap: true,
    textTransform: 'uppercase' as const
  },
  description: {
    maxWidth: 750,
    maxHeight: 120,
    fontFamily: FONTS.mono,
    basePx: 14,
    lineHeight: 1.35,
    letterSpacingEm: 0.02,
    allowWrap: true
  },
  signatoryName: {
    maxWidth: footerColumnWidth,
    maxHeight: 28,
    fontFamily: FONTS.display,
    basePx: 18,
    allowWrap: false,
    letterSpacingEm: -0.01,
    textTransform: 'uppercase' as const
  },
  signatoryRole: {
    maxWidth: footerColumnWidth,
    maxHeight: 24,
    fontFamily: FONTS.mono,
    basePx: 9,
    lineHeight: 1.2,
    letterSpacingEm: 0.22,
    allowWrap: true,
    textTransform: 'uppercase' as const
  }
} as const;

export const renderBrutalist: TemplateRenderer = ({ design, data }) => {
  const { accent, subtitle, description, signatoryOne, signatoryTwo, idDigits, fontSizes, roleMinHeight } =
    prepareCertificateRenderContext(design, data, FIELDS);

  const metaRowFontSize = Math.min(fontSizes.date, fontSizes.course, fontSizes.subtitle);

  const body = `
    <div class="cert t-brutalist">
      <div class="grid-bg"></div>
      <div class="header">
        <div class="org-name" style="font-size: ${fontSizes.org}px;">${escapeHtml(data.orgName)}</div>
        <div class="blk" style="font-size: ${fontSizes.certId}px;">${escapeHtml(data.certificateId)}</div>
      </div>
      <div class="title-block">
        <div class="num">&#8470;<span>${escapeHtml(idDigits)}</span></div>
      </div>
      <div class="meta-row">
        <div>
          <div class="k">Date</div>
          <div class="v">${escapeHtml(data.date)}</div>
        </div>
        <div>
          <div class="k">Award</div>
          <div class="v">${escapeHtml(data.courseName)}</div>
        </div>
        <div>
          <div class="k">Class</div>
          <div class="v">${escapeHtml(subtitle)}</div>
        </div>
      </div>
      <div class="recipient-block">
        <div class="lbl">Awarded To</div>
        <div class="recipient" style="font-size: ${fontSizes.recipient}px;">${escapeHtml(data.recipientName)}</div>
        ${description ? `<div class="description" style="font-size: ${fontSizes.description}px;">${escapeHtml(description)}</div>` : ''}
      </div>
      <div class="stamp">Verified</div>
      <div class="footer">
        ${renderSignatoryBlock(signatoryOne, { nameClass: 'name', roleClass: 'lbl', roleFirst: true })}
        ${renderSignatoryBlock(signatoryTwo, { nameClass: 'name', roleClass: 'lbl', roleFirst: true })}
      </div>
    </div>
  `;

  const styles = `
    .t-brutalist {
      background: #f0ede4;
      color: #000;
      font-family: '${FONTS.display}', sans-serif;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .t-brutalist .grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .t-brutalist .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 35px ${certPaddingHorizontal}px 0;
      margin-bottom: 10px;
      position: relative;
      z-index: 2;
      font-family: '${FONTS.mono}', monospace;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    .t-brutalist .org-name {
      letter-spacing: ${FIELDS.org.letterSpacingEm}em;
      max-width: ${FIELDS.org.maxWidth}px;
      max-height: ${FIELDS.org.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-brutalist .header .blk {
      background: ${accent};
      color: #fff;
      padding: ${certIdPaddingVertical}px ${certIdPaddingHorizontal}px;
      max-width: ${FIELDS.certId.maxWidth + certIdPaddingHorizontal * 2}px;
      max-height: ${FIELDS.certId.maxHeight + certIdPaddingVertical * 2}px;
      overflow-wrap: break-word;
    }
    .t-brutalist .title-block {
      padding: 8px ${certPaddingHorizontal}px 0;
      margin-bottom: 25px;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }
    .t-brutalist .num {
      font-family: '${FIELDS.num.fontFamily}', monospace;
      font-size: ${fontSizes.num}px;
      font-weight: ${FIELDS.num.fontWeight};
      line-height: 1;
      max-height: ${FIELDS.num.maxHeight}px;
      max-width: ${numMaxWidth}px;
      color: ${accent};
      letter-spacing: ${FIELDS.num.letterSpacingEm}em;
      overflow-wrap: break-word;
    }
    .t-brutalist .num span { color: #000; }
    .t-brutalist .meta-row {
      display: grid;
      grid-template-columns: ${dateRowItemWidth}px ${courseRowItemWidth}px ${subtitleRowItemWidth}px;
      border-top: 4px solid ${accent};
      border-bottom: 2px solid #000;
      margin: 0 ${certPaddingHorizontal}px;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }
    .t-brutalist .meta-row > div {
      padding: ${metaRowCellPaddingVertical}px ${metaRowCellPaddingHorizontal}px;
      border-right: 2px solid #000;
      font-family: '${FONTS.mono}', monospace;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .t-brutalist .meta-row > div:last-child { border-right: none; }
    .t-brutalist .meta-row .k {
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
    }
    .t-brutalist .meta-row .v {
      font-size: ${metaRowFontSize}px;
      font-weight: 500;
      text-transform: ${FIELDS.course.textTransform};
      letter-spacing: ${FIELDS.course.letterSpacingEm}em;
      line-height: ${FIELDS.course.lineHeight};
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-brutalist .recipient-block {
      padding: 0 ${certPaddingHorizontal}px;
      margin-bottom: 30px;
      position: relative;
      z-index: 2;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .t-brutalist .recipient-block .lbl {
      font-family: '${FONTS.mono}', monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      color: ${accent};
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .t-brutalist .recipient {
      font-family: '${FIELDS.recipient.fontFamily}', sans-serif;
      line-height: ${FIELDS.recipient.lineHeight};
      letter-spacing: ${FIELDS.recipient.letterSpacingEm}em;
      text-transform: ${FIELDS.recipient.textTransform};
      border-left: 5px solid ${accent};
      padding-left: ${recipientPaddingLeft}px;
      margin-left: -21px;
      max-width: ${FIELDS.recipient.maxWidth + recipientPaddingLeft}px;
      max-height: ${FIELDS.recipient.maxHeight}px;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-brutalist .description {
      font-family: '${FIELDS.description.fontFamily}', monospace;
      font-weight: 400;
      line-height: ${FIELDS.description.lineHeight};
      margin-top: 20px;
      margin-bottom: 20px;
      text-transform: none;
      max-width: ${FIELDS.description.maxWidth}px;
      max-height: ${FIELDS.description.maxHeight}px;
      color: #333;
      letter-spacing: ${FIELDS.description.letterSpacingEm}em;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .t-brutalist .footer {
      flex-shrink: 0;
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 2px solid #000;
      background: #fff;
      position: relative;
      z-index: 2;
    }
    .t-brutalist .footer > div {
      padding: 14px ${certPaddingHorizontal}px;
      font-family: '${FONTS.mono}', monospace;
    }
    .t-brutalist .footer > div:first-child { border-right: 2px solid #000; }
    .t-brutalist .footer .lbl {
      font-family: '${FIELDS.signatoryRole.fontFamily}', monospace;
      font-size: ${fontSizes.signatoryRole}px;
      line-height: ${FIELDS.signatoryRole.lineHeight};
      letter-spacing: ${FIELDS.signatoryRole.letterSpacingEm}em;
      color: #666;
      text-transform: ${FIELDS.signatoryRole.textTransform};
      margin-bottom: 6px;
      max-width: ${footerColumnWidth}px;
      min-height: ${roleMinHeight}px;
      max-height: ${FIELDS.signatoryRole.maxHeight}px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow-wrap: break-word;
    }
    .t-brutalist .footer .name {
      font-family: '${FIELDS.signatoryName.fontFamily}', sans-serif;
      font-size: ${fontSizes.signatoryName}px;
      text-transform: ${FIELDS.signatoryName.textTransform};
      letter-spacing: ${FIELDS.signatoryName.letterSpacingEm}em;
      max-width: ${footerColumnWidth}px;
      max-height: ${FIELDS.signatoryName.maxHeight}px;
      overflow-wrap: break-word;
    }
    .t-brutalist .stamp {
      position: absolute;
      top: 52%;
      right: 50px;
      transform: translateY(-50%) rotate(-12deg);
      border: 3px solid ${accent};
      color: ${accent};
      padding: 10px 20px;
      font-family: '${FONTS.display}', sans-serif;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      z-index: 3;
      background: rgba(255, 255, 255, 0.6);
    }
  `;

  return { body, styles };
};
