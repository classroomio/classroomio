import { escapeHtml, getYear, type TemplateRenderer } from './shared';

export const renderPoster: TemplateRenderer = ({ design, data }) => {
  const accent = design.accentColor;
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;
  const [firstTitleWord, ...restTitleWords] = data.courseName.split(' ');
  const titleEmphasis = restTitleWords.join(' ');

  const body = `
    <div class="cert t-poster">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="content">
        <div class="top">
          <span class="pill">${escapeHtml(data.orgName)}</span>
          <span>${escapeHtml(data.certificateId)} / ${escapeHtml(data.date)}</span>
        </div>
        <div class="title">${escapeHtml(firstTitleWord || 'Award')} <em>${escapeHtml(titleEmphasis)}</em></div>
        <div class="of">${escapeHtml(subtitle)}</div>
        <div class="recipient-area">
          <div class="lbl">Awarded To</div>
          <div class="recipient">${escapeHtml(data.recipientName)}</div>
        </div>
        <div class="description">${escapeHtml(description)}</div>
        <div class="bottom">
          <div>
            <div class="k">${escapeHtml(signatoryOne.role)}</div>
            <div class="v">${escapeHtml(signatoryOne.name)}</div>
          </div>
          <div>
            <div class="k">${escapeHtml(signatoryTwo.role)}</div>
            <div class="v">${escapeHtml(signatoryTwo.name)}</div>
          </div>
          <div>
            <div class="k">Issued</div>
            <div class="v">${escapeHtml(data.date)}</div>
          </div>
        </div>
      </div>
      <div class="corner-num">${getYear(data.date)}</div>
    </div>
  `;

  const styles = `
    .t-poster {
      background: #fef2dc;
      color: #1a1a1a;
      padding: 0;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
    }
    .t-poster .blob {
      position: absolute;
      width: 550px;
      height: 550px;
      border-radius: 50%;
      filter: blur(2px);
      opacity: 0.95;
    }
    .t-poster .blob-1 {
      background: ${accent};
      top: -180px;
      right: -120px;
    }
    .t-poster .blob-2 {
      background: #1e3a8a;
      bottom: -200px;
      left: -150px;
      width: 480px;
      height: 480px;
    }
    .t-poster .blob-3 {
      background: #fbbf24;
      top: 40%;
      left: 55%;
      width: 200px;
      height: 200px;
    }
    .t-poster .content {
      position: relative;
      z-index: 2;
      height: 100%;
      padding: 50px 55px;
      display: flex;
      flex-direction: column;
    }
    .t-poster .top {
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 30px;
    }
    .t-poster .top .pill {
      background: ${accent};
      color: #fef2dc;
      padding: 5px 12px;
      border-radius: 100px;
    }
    .t-poster .title {
      font-family: 'Playfair Display', serif;
      font-size: 140px;
      font-weight: 900;
      line-height: 0.85;
      letter-spacing: -0.04em;
      color: #1a1a1a;
    }
    .t-poster .title em {
      font-style: italic;
      font-weight: 400;
      color: ${accent};
    }
    .t-poster .of {
      font-family: 'Playfair Display', serif;
      font-size: 62px;
      font-style: italic;
      font-weight: 400;
      line-height: 1;
      margin-top: -4px;
      color: #1a1a1a;
    }
    .t-poster .recipient-area {
      margin-top: 40px;
      background: ${accent};
      color: #fef2dc;
      padding: 24px 30px;
      align-self: flex-start;
      max-width: 75%;
      transform: rotate(-1deg);
      box-shadow: 8px 8px 0 #1a1a1a;
    }
    .t-poster .recipient-area .lbl {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.22em;
      color: #fef2dc;
      opacity: 0.8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .t-poster .recipient {
      font-family: 'Playfair Display', serif;
      font-size: 54px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .t-poster .description {
      font-size: 15px;
      line-height: 1.55;
      margin-top: 20px;
      max-width: 580px;
      color: #1a1a1a;
      font-weight: 500;
    }
    .t-poster .bottom {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      border-top: 2px solid #1a1a1a;
      padding-top: 18px;
      font-family: 'JetBrains Mono', monospace;
    }
    .t-poster .bottom .k {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 3px;
    }
    .t-poster .bottom .v {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .t-poster .corner-num {
      position: absolute;
      bottom: 36px;
      right: 50px;
      font-family: 'Playfair Display', serif;
      font-size: 80px;
      font-weight: 900;
      font-style: italic;
      color: ${accent};
      z-index: 3;
      line-height: 0.8;
    }
  `;

  return { body, styles };
};
