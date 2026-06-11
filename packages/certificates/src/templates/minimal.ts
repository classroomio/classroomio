import {
  escapeHtml,
  renderFooterMetaBlock,
  renderSignatoryBlock,
  SIGNATURE_IMAGE_STYLES,
  type TemplateRenderer
} from './shared';

export const renderMinimal: TemplateRenderer = ({ design, data }) => {
  const accent = design.accentColor;
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;

  const body = `
    <div class="cert t-minimal">
      <div class="top">
        <span>${escapeHtml(data.orgName)}</span>
        <span>${escapeHtml(data.certificateId)} &middot; ${escapeHtml(data.date)}</span>
      </div>
      <div class="body">
        <div class="small">&mdash; ${escapeHtml(subtitle)} &mdash;</div>
        <div class="title">${escapeHtml(data.courseName)}</div>
        <div class="recipient-row">
          <div class="num">${escapeHtml(data.certificateId)}</div>
          <div class="recipient">${escapeHtml(data.recipientName)}</div>
        </div>
        <div class="description">${escapeHtml(description)}</div>
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
      font-family: 'Space Grotesk', sans-serif;
      display: flex;
      flex-direction: column;
      position: relative;
      border-left: 12px solid ${accent};
    }
    .t-minimal .top {
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #999;
      padding-bottom: 20px;
      border-bottom: 1px solid #0a0a0a;
    }
    .t-minimal .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 30px 0;
    }
    .t-minimal .small {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 22px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      align-self: flex-start;
    }
    .t-minimal .small::before {
      content: '';
      width: 28px;
      height: 2px;
      background: ${accent};
    }
    .t-minimal .small::after {
      content: '';
      width: 28px;
      height: 2px;
      background: ${accent};
    }
    .t-minimal .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 68px;
      font-weight: 300;
      font-style: italic;
      line-height: 1;
      margin-bottom: 50px;
      letter-spacing: -0.01em;
    }
    .t-minimal .recipient-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 30px;
      align-items: end;
      border-bottom: 2px solid ${accent};
      padding-bottom: 14px;
      margin-bottom: 24px;
    }
    .t-minimal .recipient-row .num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: ${accent};
      padding-bottom: 14px;
      letter-spacing: 0.1em;
    }
    .t-minimal .recipient {
      font-family: 'Cormorant Garamond', serif;
      font-size: 88px;
      font-weight: 400;
      line-height: 0.95;
      letter-spacing: -0.02em;
    }
    .t-minimal .description {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      font-weight: 400;
    }
    .t-minimal .footer {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      align-items: end;
      gap: 30px;
      padding-top: 20px;
      border-top: 1px solid #0a0a0a;
      font-family: 'JetBrains Mono', monospace;
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
    }
    .t-minimal .footer .v {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
      font-weight: 500;
      line-height: 1.1;
    }
    .t-minimal .footer .ref .k { color: ${accent}; }
    .t-minimal .footer .ref .v { color: ${accent}; }
    ${SIGNATURE_IMAGE_STYLES}
  `;

  return { body, styles };
};
