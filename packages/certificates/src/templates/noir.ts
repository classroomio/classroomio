import { escapeHtml, getYear, shadeColor, type TemplateRenderer } from './shared';

export const renderNoir: TemplateRenderer = ({ design, data }) => {
  const accent = design.accentColor;
  const accentDeep = shadeColor(accent, -30);
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;

  const body = `
    <div class="cert t-noir">
      <div class="top">
        <span>${escapeHtml(data.certificateId)}</span>
        <div class="line"></div>
        <span>${escapeHtml(data.orgName)}</span>
        <div class="line"></div>
        <span>${escapeHtml(data.date)}</span>
      </div>
      <div class="crest">&#10022; &#10022; &#10022;</div>
      <div class="title">${escapeHtml(data.courseName)}</div>
      <div class="title-line">
        <div class="l"></div>
        <span>${escapeHtml(subtitle)}</span>
        <div class="l"></div>
      </div>
      <div class="presented">presented to</div>
      <div class="recipient">${escapeHtml(data.recipientName)}</div>
      <div class="description">${escapeHtml(description)}</div>
      <div class="footer">
        <div class="sig">
          <div class="name">${escapeHtml(signatoryOne.name)}</div>
          <div class="label">${escapeHtml(signatoryOne.role)}</div>
        </div>
        <div class="medal">
          <div class="yr">${getYear(data.date)}</div>
          <div class="lbl">&#9733; AWARD &#9733;</div>
        </div>
        <div class="sig">
          <div class="name">${escapeHtml(signatoryTwo.name)}</div>
          <div class="label">${escapeHtml(signatoryTwo.role)}</div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .t-noir {
      background: #0e0e0e;
      color: #f5f1e8;
      padding: 55px;
      font-family: 'Cormorant Garamond', serif;
      background-image:
        radial-gradient(circle at 30% 20%, ${accent}14, transparent 50%),
        radial-gradient(circle at 70% 80%, ${accent}0c, transparent 50%);
    }
    .t-noir::before {
      content: '';
      position: absolute;
      inset: 30px;
      border: 1px solid ${accent}66;
      pointer-events: none;
    }
    .t-noir::after {
      content: '';
      position: absolute;
      inset: 36px;
      border: 1px solid ${accent}33;
      pointer-events: none;
    }
    .t-noir .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      font-family: 'Cinzel', serif;
      font-size: 11px;
      letter-spacing: 0.4em;
      color: ${accent};
      text-transform: uppercase;
    }
    .t-noir .top .line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, ${accent}, transparent);
      margin: 0 20px;
    }
    .t-noir .crest {
      text-align: center;
      margin-top: 30px;
      font-family: 'Cinzel', serif;
      color: ${accent};
      font-size: 32px;
      letter-spacing: 0.3em;
    }
    .t-noir .title {
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 84px;
      font-weight: 400;
      font-style: italic;
      margin: 20px 0 4px;
      color: #f5f1e8;
      line-height: 1;
    }
    .t-noir .title-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      margin-bottom: 36px;
    }
    .t-noir .title-line .l {
      width: 80px;
      height: 1px;
      background: ${accent};
    }
    .t-noir .title-line span {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      letter-spacing: 0.5em;
      color: ${accent};
      text-transform: uppercase;
    }
    .t-noir .presented {
      text-align: center;
      font-style: italic;
      font-size: 18px;
      color: #c9b88c;
      margin-bottom: 6px;
    }
    .t-noir .recipient {
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 72px;
      font-weight: 400;
      color: ${accent};
      margin: 0 80px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${accent}66;
      line-height: 1.05;
    }
    .t-noir .description {
      text-align: center;
      font-style: italic;
      font-size: 19px;
      margin: 24px 110px 0;
      color: #c9b88c;
      line-height: 1.6;
    }
    .t-noir .footer {
      position: absolute;
      bottom: 90px;
      left: 80px;
      right: 80px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 40px;
    }
    .t-noir .sig {
      text-align: center;
      border-top: 1px solid ${accent};
      padding-top: 6px;
    }
    .t-noir .sig .name {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-style: italic;
      color: #f5f1e8;
    }
    .t-noir .sig .label {
      font-family: 'Cinzel', serif;
      font-size: 10px;
      letter-spacing: 0.3em;
      color: ${accent};
      text-transform: uppercase;
      margin-top: 2px;
    }
    .t-noir .medal {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: radial-gradient(circle, ${accent} 0%, ${accentDeep} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #0e0e0e;
      box-shadow: 0 0 30px ${accent}4d;
      position: relative;
    }
    .t-noir .medal::before {
      content: '';
      position: absolute;
      inset: 6px;
      border: 1px solid #0e0e0e;
      border-radius: 50%;
    }
    .t-noir .medal .yr {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
    }
    .t-noir .medal .lbl {
      font-family: 'Cinzel', serif;
      font-size: 8px;
      letter-spacing: 0.2em;
    }
  `;

  return { body, styles };
};
