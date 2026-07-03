import type { OrgSiteOgInput } from '../types';
import { escapeHtml, orgInitials, shadeColor, truncateText } from '../utils';

const FONTS_LINK_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap';

export function renderOrgSiteOgTemplate(input: OrgSiteOgInput): { body: string; styles: string } {
  const orgName = truncateText(input.orgName, 48);
  const tagline = input.tagline ? truncateText(input.tagline, 90) : '';
  const themeColor = input.themeColor || '#1d4ed8';
  const gradientEnd = shadeColor(themeColor, -35);
  const initials = orgInitials(orgName);

  const logoMarkup = input.logoUrl
    ? `<img class="logo-image" src="${escapeHtml(input.logoUrl)}" alt="" />`
    : `<div class="logo-fallback" aria-hidden="true">${escapeHtml(initials)}</div>`;

  const taglineMarkup = tagline ? `<p class="tagline">${escapeHtml(tagline)}</p>` : '';

  const watermarkMarkup = input.showWatermark
    ? `<div class="watermark">Powered by <strong>ClassroomIO</strong></div>`
    : '';

  const body = `
<div class="canvas">
  <div class="card">
    <div class="glow"></div>
    <div class="content">
      <div class="logo-wrap">${logoMarkup}</div>
      <div class="copy">
        <h1 class="org-name">${escapeHtml(orgName)}</h1>
        ${taglineMarkup}
      </div>
    </div>
    ${watermarkMarkup}
  </div>
</div>`;

  const styles = `
@import url('${FONTS_LINK_HREF}');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 1200px;
  height: 630px;
  overflow: hidden;
}

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.canvas {
  width: 1200px;
  height: 630px;
  background: linear-gradient(135deg, ${themeColor} 0%, ${gradientEnd} 100%);
}

.card {
  position: relative;
  width: 1200px;
  height: 630px;
  padding: 72px 80px;
  color: #ffffff;
  overflow: hidden;
}

.glow {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 420px;
  height: 420px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(8px);
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 40px;
  max-width: 1040px;
}

.logo-wrap {
  flex: 0 0 auto;
}

.logo-image,
.logo-fallback {
  width: 128px;
  height: 128px;
  border-radius: 28px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.16);
  border: 2px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.copy {
  min-width: 0;
}

.org-name {
  font-size: 64px;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.tagline {
  margin-top: 18px;
  max-width: 760px;
  font-size: 30px;
  line-height: 1.35;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  text-wrap: balance;
}

.watermark {
  position: absolute;
  right: 48px;
  bottom: 36px;
  z-index: 2;
  padding: 10px 16px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.01em;
}

.watermark strong {
  font-weight: 700;
}`;

  return { body, styles };
}
