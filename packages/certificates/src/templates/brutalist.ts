import { escapeHtml, type TemplateRenderer } from './shared';

export const renderBrutalist: TemplateRenderer = ({ design, data }) => {
  const accent = design.accentColor;
  const subtitle = design.subtitle ?? '';
  const description = design.descriptionOverride || data.courseDescription;
  const [signatoryOne, signatoryTwo] = design.signatories;
  const idDigits = data.certificateId.match(/\d+/)?.[0] ?? '00';

  const body = `
    <div class="cert t-brutalist">
      <div class="grid-bg"></div>
      <div class="header">
        <div>${escapeHtml(data.orgName)}</div>
        <div class="blk">${escapeHtml(data.certificateId)}</div>
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
        <div class="recipient">${escapeHtml(data.recipientName)}</div>
        <div class="description">${escapeHtml(description)}</div>
      </div>
      <div class="stamp">Verified</div>
      <div class="footer">
        <div>
          <div class="lbl">${escapeHtml(signatoryOne.role)}</div>
          <div class="name">${escapeHtml(signatoryOne.name)}</div>
        </div>
        <div>
          <div class="lbl">${escapeHtml(signatoryTwo.role)}</div>
          <div class="name">${escapeHtml(signatoryTwo.name)}</div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .t-brutalist {
      background: #f0ede4;
      color: #000;
      font-family: 'Archivo Black', sans-serif;
      padding: 0;
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
      padding: 40px 50px 0;
      position: relative;
      z-index: 2;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .t-brutalist .header .blk {
      background: ${accent};
      color: #fff;
      padding: 6px 10px;
    }
    .t-brutalist .title-block {
      padding: 40px 50px 0;
      position: relative;
      z-index: 2;
    }
    .t-brutalist .num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 120px;
      font-weight: 700;
      line-height: 0.85;
      color: ${accent};
      letter-spacing: -0.04em;
    }
    .t-brutalist .num span { color: #000; }
    .t-brutalist .meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      border-top: 4px solid ${accent};
      border-bottom: 2px solid #000;
      margin: 30px 50px 0;
      position: relative;
      z-index: 2;
    }
    .t-brutalist .meta-row > div {
      padding: 14px 18px;
      border-right: 2px solid #000;
      font-family: 'JetBrains Mono', monospace;
    }
    .t-brutalist .meta-row > div:last-child { border-right: none; }
    .t-brutalist .meta-row .k {
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 4px;
    }
    .t-brutalist .meta-row .v {
      font-size: 18px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .t-brutalist .recipient-block {
      padding: 40px 50px;
      position: relative;
      z-index: 2;
    }
    .t-brutalist .recipient-block .lbl {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      color: ${accent};
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .t-brutalist .recipient {
      font-size: 88px;
      line-height: 0.95;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      border-left: 6px solid ${accent};
      padding-left: 18px;
      margin-left: -24px;
    }
    .t-brutalist .description {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      margin-top: 20px;
      text-transform: none;
      max-width: 780px;
      color: #333;
      letter-spacing: 0.02em;
    }
    .t-brutalist .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 2px solid #000;
      background: #fff;
    }
    .t-brutalist .footer > div {
      padding: 18px 50px;
      font-family: 'JetBrains Mono', monospace;
    }
    .t-brutalist .footer > div:first-child { border-right: 2px solid #000; }
    .t-brutalist .footer .lbl {
      font-size: 9px;
      letter-spacing: 0.22em;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .t-brutalist .footer .name {
      font-family: 'Archivo Black', sans-serif;
      font-size: 22px;
      text-transform: uppercase;
      letter-spacing: -0.01em;
    }
    .t-brutalist .stamp {
      position: absolute;
      top: 50%;
      right: 50px;
      transform: translateY(-50%) rotate(-12deg);
      border: 3px solid ${accent};
      color: ${accent};
      padding: 10px 20px;
      font-family: 'Archivo Black', sans-serif;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      z-index: 3;
      background: rgba(255, 255, 255, 0.6);
    }
  `;

  return { body, styles };
};
