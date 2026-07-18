export type OrgSiteOgInput = {
  orgName: string;
  logoUrl?: string;
  tagline?: string;
  themeColor: string;
  showWatermark: boolean;
};

export type OrgSiteOgRenderResult = {
  html: string;
  styles: string;
};

const FONTS_LINK_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap';

function escapeHtml(input: unknown): string {
  return String(input ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function orgInitials(orgName: string): string {
  const words = orgName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
  }

  return orgName.trim().slice(0, 2).toUpperCase();
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) {
    return null;
  }

  const numeric = parseInt(normalized, 16);
  if (Number.isNaN(numeric)) {
    return null;
  }

  return {
    red: (numeric >> 16) & 0xff,
    green: (numeric >> 8) & 0xff,
    blue: numeric & 0xff
  };
}

function mixWithWhite(hex: string, amount = 0.9): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return '#f8fafc';
  }

  const red = Math.round(rgb.red * (1 - amount) + 255 * amount);
  const green = Math.round(rgb.green * (1 - amount) + 255 * amount);
  const blue = Math.round(rgb.blue * (1 - amount) + 255 * amount);

  return `rgb(${red}, ${green}, ${blue})`;
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(29, 78, 216, ${alpha})`;
  }

  return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${alpha})`;
}

function darken(hex: string, amount = 0.55): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return '#0f172a';
  }

  const red = Math.round(rgb.red * (1 - amount));
  const green = Math.round(rgb.green * (1 - amount));
  const blue = Math.round(rgb.blue * (1 - amount));

  return `rgb(${red}, ${green}, ${blue})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads a public-facing tagline from raw org `landingpage` JSON without
 * depending on dashboard normalization helpers.
 */
export function extractOrgTagline(landingpage: unknown): string | undefined {
  if (!isRecord(landingpage)) {
    return undefined;
  }

  const footer = landingpage.footer;
  if (isRecord(footer)) {
    const brand = footer.brand;
    if (isRecord(brand) && typeof brand.tagline === 'string') {
      const footerTagline = brand.tagline.trim();
      if (footerTagline) {
        return footerTagline;
      }
    }
  }

  const hero = landingpage.hero;
  if (isRecord(hero) && typeof hero.subheading === 'string') {
    const subheading = hero.subheading.trim();
    if (subheading) {
      return subheading;
    }
  }

  return undefined;
}

function renderOrgSiteOgTemplate(input: OrgSiteOgInput): { body: string; styles: string } {
  const orgName = truncateText(input.orgName, 48);
  const tagline = input.tagline ? truncateText(input.tagline, 90) : '';
  const themeColor = input.themeColor || '#1d4ed8';
  const background = mixWithWhite(themeColor, 0.9);
  const titleColor = darken(themeColor, 0.62);
  const taglineColor = darken(themeColor, 0.42);
  const labelColor = rgba(themeColor, 0.72);
  const initials = orgInitials(orgName);

  const hasLogo = Boolean(input.logoUrl);
  const logoWrapClass = hasLogo ? 'logo-wrap logo-wrap--image' : 'logo-wrap logo-wrap--initials';

  const logoMarkup = hasLogo
    ? `<img class="logo-image" src="${escapeHtml(input.logoUrl)}" alt="" />`
    : `<span class="logo-initials" aria-hidden="true">${escapeHtml(initials)}</span>`;

  const taglineMarkup = tagline ? `<p class="tagline">${escapeHtml(tagline)}</p>` : '';

  const watermarkMarkup = input.showWatermark
    ? `<div class="watermark">Powered by <strong>ClassroomIO</strong></div>`
    : '';

  const body = `
<div class="canvas">
  <div class="decor-circle"></div>
  <div class="${logoWrapClass}">${logoMarkup}</div>
  <div class="content">
    <p class="academy-label">Academy</p>
    <div class="accent-bar"></div>
    <h1 class="org-name">${escapeHtml(orgName)}</h1>
    ${taglineMarkup}
  </div>
  ${watermarkMarkup}
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
  position: relative;
  width: 1200px;
  height: 630px;
  background: ${background};
  overflow: hidden;
}

.decor-circle {
  position: absolute;
  top: -180px;
  right: -120px;
  width: 520px;
  height: 520px;
  border-radius: 9999px;
  background: ${rgba(themeColor, 0.22)};
}

.logo-wrap {
  position: absolute;
  top: 56px;
  left: 64px;
  z-index: 2;
  width: 88px;
  height: 88px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-wrap--initials {
  background: ${themeColor};
  box-shadow: 0 16px 40px ${rgba(themeColor, 0.28)};
}

.logo-wrap--image {
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.logo-image {
  width: 88px;
  height: 88px;
  border-radius: 20px;
  object-fit: cover;
}

.logo-initials {
  color: #ffffff;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.content {
  position: absolute;
  left: 72px;
  bottom: 72px;
  z-index: 2;
  max-width: 760px;
}

.academy-label {
  font-size: 22px;
  font-weight: 600;
  color: ${labelColor};
  letter-spacing: 0.01em;
}

.accent-bar {
  width: 56px;
  height: 5px;
  border-radius: 9999px;
  background: ${themeColor};
  margin: 14px 0 22px;
}

.org-name {
  font-size: 58px;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${titleColor};
  text-wrap: balance;
}

.tagline {
  margin-top: 16px;
  max-width: 720px;
  font-size: 30px;
  line-height: 1.35;
  font-weight: 500;
  color: ${taglineColor};
  text-wrap: balance;
}

.watermark {
  position: absolute;
  right: 64px;
  bottom: 40px;
  z-index: 3;
  padding: 10px 16px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid ${rgba(themeColor, 0.18)};
  font-size: 16px;
  font-weight: 500;
  color: ${taglineColor};
  letter-spacing: 0.01em;
}

.watermark strong {
  font-weight: 700;
  color: ${titleColor};
}`;

  return { body, styles };
}

export function renderOrgSiteOg(input: OrgSiteOgInput): OrgSiteOgRenderResult {
  const { body, styles } = renderOrgSiteOgTemplate(input);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200,initial-scale=1.0">
  <title>${escapeHtml(input.orgName)} Open Graph</title>
</head>
<body>
${body}
</body>
</html>`;

  return { html, styles };
}
