import { escapeHtml, getYear, type TemplateRenderer } from './shared';

export const renderClassique: TemplateRenderer = ({ design, data }) => {
  const accent = design.accentColor;
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;

  const body = `
    <div class="cert t-classique">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <div class="top-tag">${escapeHtml(data.orgName)}</div>
      <div class="ornament">&#10086;</div>
      <div class="title">${escapeHtml(data.courseName)}</div>
      <div class="subtitle">${escapeHtml(subtitle)}</div>
      <div class="presented">&mdash; this is to certify that &mdash;</div>
      <div class="recipient">${escapeHtml(data.recipientName)}</div>
      <div class="description">${escapeHtml(description)}</div>
      <div class="footer">
        <div class="sig">
          <div class="name">${escapeHtml(signatoryOne.name)}</div>
          <div class="label">${escapeHtml(signatoryOne.role)}</div>
        </div>
        <div class="seal">
          <div class="star">&#9733;</div>
          <div class="yr">${getYear(data.date)}</div>
          <div class="lbl">${escapeHtml(data.certificateId)}</div>
        </div>
        <div class="sig">
          <div class="name">${escapeHtml(signatoryTwo.name)}</div>
          <div class="label">${escapeHtml(signatoryTwo.role)}</div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .t-classique {
      background: #faf6ec;
      color: #2a1810;
      padding: 55px;
      font-family: 'Cormorant Garamond', serif;
    }
    .t-classique::before {
      content: '';
      position: absolute;
      inset: 30px;
      border: 2px double ${accent};
      pointer-events: none;
    }
    .t-classique::after {
      content: '';
      position: absolute;
      inset: 42px;
      border: 1px solid ${accent};
      pointer-events: none;
    }
    .t-classique .corner {
      position: absolute;
      width: 80px;
      height: 80px;
      border: 1px solid ${accent};
      pointer-events: none;
    }
    .t-classique .corner.tl { top: 55px; left: 55px; border-right: none; border-bottom: none; }
    .t-classique .corner.tr { top: 55px; right: 55px; border-left: none; border-bottom: none; }
    .t-classique .corner.bl { bottom: 55px; left: 55px; border-right: none; border-top: none; }
    .t-classique .corner.br { bottom: 55px; right: 55px; border-left: none; border-top: none; }
    .t-classique .ornament {
      font-family: 'Cinzel', serif;
      text-align: center;
      font-size: 24px;
      color: ${accent};
      margin: 8px 0;
      letter-spacing: 0.5em;
    }
    .t-classique .top-tag {
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: 13px;
      letter-spacing: 0.6em;
      color: ${accent};
      margin-top: 60px;
      text-transform: uppercase;
    }
    .t-classique .title {
      text-align: center;
      font-family: 'Bodoni Moda', serif;
      font-size: 78px;
      font-weight: 400;
      font-style: italic;
      margin: 8px 0 4px;
      color: #2a1810;
    }
    .t-classique .subtitle {
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: 14px;
      letter-spacing: 0.45em;
      color: ${accent};
      margin-bottom: 36px;
      text-transform: uppercase;
    }
    .t-classique .presented {
      text-align: center;
      font-style: italic;
      font-size: 18px;
      color: #5a3a25;
      margin-bottom: 8px;
    }
    .t-classique .recipient {
      text-align: center;
      font-family: 'Bodoni Moda', serif;
      font-size: 64px;
      font-weight: 400;
      margin: 6px 120px 12px;
      border-bottom: 2px solid ${accent};
      padding-bottom: 14px;
      line-height: 1.05;
    }
    .t-classique .description {
      text-align: center;
      font-size: 18px;
      font-style: italic;
      color: #3a2515;
      margin: 20px 110px 0;
      line-height: 1.6;
    }
    .t-classique .footer {
      position: absolute;
      bottom: 90px;
      left: 55px;
      right: 55px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 40px;
    }
    .t-classique .sig {
      text-align: center;
      border-top: 1px solid ${accent};
      padding-top: 6px;
    }
    .t-classique .sig .name {
      font-family: 'Bodoni Moda', serif;
      font-size: 20px;
      font-style: italic;
    }
    .t-classique .sig .label {
      font-family: 'Cinzel', serif;
      font-size: 10px;
      letter-spacing: 0.3em;
      color: ${accent};
      text-transform: uppercase;
      margin-top: 2px;
    }
    .t-classique .seal {
      width: 120px;
      height: 120px;
      border: 2px solid ${accent};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: ${accent};
      background: radial-gradient(circle, #faf6ec 60%, ${accent}1a);
      position: relative;
    }
    .t-classique .seal::before {
      content: '';
      position: absolute;
      inset: 6px;
      border: 1px dashed ${accent};
      border-radius: 50%;
    }
    .t-classique .seal .star { font-size: 20px; }
    .t-classique .seal .yr {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 600;
      margin-top: 2px;
    }
    .t-classique .seal .lbl {
      font-family: 'Cinzel', serif;
      font-size: 8px;
      letter-spacing: 0.2em;
      margin-top: 2px;
    }
  `;

  return { body, styles };
};
