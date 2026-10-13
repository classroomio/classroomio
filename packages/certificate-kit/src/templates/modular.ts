import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from '../constants';
import type { CertificateDesignV1, CertificatePreviewData } from '../types';
import { escapeHtml, getYear, type TemplateRenderer } from './shared';

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function color(value: string | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

function safeImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('data:image/')) return value;

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:' ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

function number(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return fallback;

  return Math.max(minimum, Math.min(maximum, value as number));
}

function elementAttributes(design: CertificateDesignV1, id: string): string {
  const element = design.elements?.[id];
  if (element?.positionMode !== 'custom' || element.x == null || element.y == null) {
    return `data-certificate-element="${id}" data-position-mode="auto"`;
  }

  const width = number(element.width, 0, 0, CERTIFICATE_WIDTH);
  const height = number(element.height, 0, 0, CERTIFICATE_HEIGHT);
  const x = number(element.x, 0, 0, CERTIFICATE_WIDTH - width);
  const y = number(element.y, 0, 0, CERTIFICATE_HEIGHT - height);
  const zIndex = number(element.zIndex, 2, 0, 50);
  const dimensions = `${width ? `width:${width}px;` : ''}${height ? `height:${height}px;` : ''}`;

  return `data-certificate-element="${id}" data-position-mode="custom" style="position:absolute;left:${x}px;top:${y}px;z-index:${zIndex};margin:0;transform:none;${dimensions}"`;
}

function enabled(design: CertificateDesignV1, id: string, fallback = true): boolean {
  return design.elements?.[id]?.enabled ?? fallback;
}

function renderSignatories(design: CertificateDesignV1): string {
  const signatories = design.signatories
    .map((signatory, index) => ({ signatory, index }))
    .filter(({ signatory }) => signatory.enabled !== false)
    .slice(0, 3);
  if (!enabled(design, 'signatories') || signatories.length === 0) return '';

  const defaultPositions = signatories.length === 1 ? [440] : signatories.length === 2 ? [110, 770] : [110, 440, 770];

  return signatories
    .map(({ signatory, index }, positionIndex) => {
      const id = `signatory-${index}`;
      const hasCustomPosition = design.elements?.[id]?.positionMode === 'custom';
      const attributes = hasCustomPosition
        ? elementAttributes(design, id)
        : `data-certificate-element="${id}" data-position-mode="auto" style="position:absolute;left:${defaultPositions[positionIndex]}px;top:648px;width:220px;height:78px"`;

      return `<div class="modular-signatory" ${attributes}>
          <div class="modular-signature-line"></div>
          <strong>${escapeHtml(signatory.name)}</strong>
          <span>${escapeHtml(signatory.role)}</span>
        </div>`;
    })
    .join('');
}

function renderBadge(design: CertificateDesignV1, data: CertificatePreviewData, year: string): string {
  if (!enabled(design, 'badge') || design.badge?.style === 'none') return '';

  const label = escapeHtml(design.badge?.label || 'OFFICIAL');
  const badgeStyle = design.badge?.style ?? 'gold_seal';
  const imageUrl =
    safeImageUrl(design.badge?.customImageUrl) ?? (badgeStyle === 'org_logo' ? safeImageUrl(data.orgLogoUrl) : null);
  const image = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" />` : '';

  return `<div class="modular-badge modular-badge-${badgeStyle}" ${elementAttributes(design, 'badge')}>
    <div class="modular-badge-ring">
      ${image || `<span>${label}</span><strong>${escapeHtml(year)}</strong><small>★ ★ ★</small>`}
    </div>
  </div>`;
}

function renderCredential(design: CertificateDesignV1, data: CertificatePreviewData): string {
  if (!enabled(design, 'qrCode') || design.qrCode?.enabled === false) return '';

  const position = design.qrCode?.position ?? 'bottom_right';
  return `<div class="modular-credential modular-credential-${position}" ${elementAttributes(design, 'qrCode')}>
    <span class="modular-qr">▦</span>
    <span><small>${escapeHtml(design.copy?.verifiedCredentialLabel || 'CREDENTIAL REFERENCE')}</small><strong>${escapeHtml(data.certificateId)}</strong></span>
  </div>`;
}

export const renderModular: TemplateRenderer = ({ design, data }) => {
  const primary = color(design.border?.primaryColor, color(design.accentColor, '#d4af37'));
  const accent = color(design.border?.accentColor, '#85581a');
  const background = color(design.background?.primaryColor, '#faf8f2');
  const backgroundAccent = color(design.background?.secondaryColor, '#f3ede0');
  const text = color(design.typography?.primaryColor, '#1a1a2e');
  const borderWidth = number(design.border?.width, 12, 1, 48);
  const borderStyle = design.border?.style ?? 'victorian';
  const titleFont = escapeHtml(design.typography?.titleFont || 'Bodoni Moda');
  const recipientFont = escapeHtml(design.typography?.recipientFont || 'Great Vibes');
  const bodyFont = escapeHtml(design.typography?.bodyFont || 'Cormorant Garamond');
  const title = escapeHtml(design.copy?.title || design.title || 'Certificate of Achievement');
  const presentation = escapeHtml(design.copy?.presentation || design.subtitle || 'Proudly presented to');
  const completion = escapeHtml(design.copy?.completion || 'For successful completion of');
  const description = escapeHtml(design.descriptionOverride || data.courseDescription);
  const orgName = escapeHtml(design.copy?.organizationName || data.orgName);
  const year = getYear(data.date);
  const backgroundStyle = design.background?.style ?? 'parchment';
  const backgroundFill =
    backgroundStyle === 'solid'
      ? background
      : backgroundStyle === 'gradient'
        ? `linear-gradient(135deg,${background},${backgroundAccent})`
        : backgroundStyle === 'guilloche'
          ? `repeating-radial-gradient(circle at center,${background} 0 8px,${backgroundAccent} 9px 10px)`
          : `radial-gradient(circle at 50% 42%,${background} 0%,${background} 58%,${backgroundAccent} 135%)`;

  const body = `<div class="cert t-modular" data-certificate-root style="--modular-primary:${primary};--modular-accent:${accent};--modular-bg:${background};--modular-bg-accent:${backgroundAccent};--modular-background:${backgroundFill};--modular-text:${text};--modular-border-width:${borderWidth}px;--modular-title-font:'${titleFont}';--modular-recipient-font:'${recipientFont}';--modular-body-font:'${bodyFont}';">
    <div class="modular-background" ${elementAttributes(design, 'background')}></div>
    ${
      enabled(design, 'border')
        ? `<div class="modular-border modular-border-${borderStyle}" ${elementAttributes(design, 'border')}><i></i><b></b><span></span><em></em></div>`
        : ''
    }
    <div class="modular-content">
      ${enabled(design, 'header') ? `<div class="modular-org" ${elementAttributes(design, 'header')}>${orgName}</div>` : ''}
      ${enabled(design, 'title') ? `<h1 class="modular-title" ${elementAttributes(design, 'title')}>${title}</h1>` : ''}
      ${enabled(design, 'subtitle') ? `<p class="modular-presentation" ${elementAttributes(design, 'subtitle')}>${presentation}</p>` : ''}
      <div class="modular-recipient" ${elementAttributes(design, 'recipient')}>${escapeHtml(data.recipientName)}</div>
      <div class="modular-course" ${elementAttributes(design, 'course')}><small>${completion}</small><strong>${escapeHtml(data.courseName)}</strong></div>
      ${enabled(design, 'description') ? `<p class="modular-description" ${elementAttributes(design, 'description')}>${description}</p>` : ''}
      ${enabled(design, 'date') ? `<p class="modular-date" ${elementAttributes(design, 'date')}>${escapeHtml(design.copy?.dateLabel || 'Date of Conferment:')} <strong>${escapeHtml(data.date)}</strong></p>` : ''}
      ${renderSignatories(design)}
      ${renderBadge(design, data, year)}
      ${renderCredential(design, data)}
    </div>
  </div>`;

  const styles = `
    .t-modular { background:var(--modular-bg); color:var(--modular-text); font-family:var(--modular-body-font),serif; }
    .modular-background { position:absolute;inset:0;background:var(--modular-background); }
    .modular-border { position:absolute;inset:24px;border:3px solid var(--modular-primary);box-shadow:inset 0 0 0 6px var(--modular-bg),inset 0 0 0 7px var(--modular-primary);pointer-events:none; }
    .modular-border-double_gold { border-width:4px;box-shadow:inset 0 0 0 8px var(--modular-bg),inset 0 0 0 10px var(--modular-accent),inset 0 0 0 15px var(--modular-bg),inset 0 0 0 16px var(--modular-primary); }
    .modular-border-geometric { border-width:var(--modular-border-width);box-shadow:inset 0 0 0 5px var(--modular-bg),inset 0 0 0 7px var(--modular-accent); }
    .modular-border-minimal { border-width:1px;box-shadow:none; }
    .modular-border::before,.modular-border::after,.modular-border i,.modular-border b { content:'';position:absolute;width:18px;height:18px;background:var(--modular-accent); }
    .modular-border::before { top:8px;left:8px; }.modular-border::after { top:8px;right:8px; }.modular-border i { bottom:8px;left:8px; }.modular-border b { bottom:8px;right:8px; }
    .modular-content { position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;padding:70px 76px 52px; }
    .modular-org { font-family:Cinzel,serif;font-size:14px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--modular-primary);margin-top:6px; }
    .modular-title { margin:12px 0 3px;font-family:var(--modular-title-font),serif;font-size:38px;line-height:1.15;letter-spacing:.05em;text-transform:uppercase; }
    .modular-presentation { margin:0;font-family:Cinzel,serif;font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--modular-primary); }
    .modular-recipient { margin-top:18px;min-width:520px;padding:0 40px 8px;border-bottom:1px solid color-mix(in srgb,var(--modular-primary) 55%,transparent);font-family:var(--modular-recipient-font),cursive;font-size:56px;line-height:1.05; }
    .modular-course { margin-top:17px;display:flex;flex-direction:column;gap:5px; }
    .modular-course small { font-family:Cinzel,serif;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--modular-primary); }
    .modular-course strong { max-width:740px;font-family:var(--modular-title-font),serif;font-size:21px;line-height:1.2; }
    .modular-description { max-width:680px;margin-top:12px;font-size:15px;line-height:1.4;font-style:italic;color:color-mix(in srgb,var(--modular-text) 70%,transparent); }
    .modular-date { margin-top:14px;font-family:Cinzel,serif;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in srgb,var(--modular-text) 55%,transparent); }
    .modular-date strong { color:var(--modular-text); }
    .modular-signatory { display:flex;flex-direction:column;align-items:center;justify-content:flex-start; }
    .modular-signature-line { width:100%;border-top:1px solid var(--modular-primary);margin-bottom:6px; }
    .modular-signatory strong { font-family:var(--modular-body-font),serif;font-size:15px; }.modular-signatory span { font-family:Cinzel,serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--modular-primary); }
    .modular-badge { position:absolute;left:50%;bottom:40px;transform:translateX(-50%);width:104px;height:104px;border-radius:50%;padding:7px;background:linear-gradient(145deg,#f7db6a,var(--modular-primary) 48%,var(--modular-accent));box-shadow:0 4px 12px rgba(79,50,6,.22); }
    .modular-badge-ribbon { border-radius:20% 20% 50% 50%; }.modular-badge-crest { border-radius:50% 50% 45% 45%; }.modular-badge-wax_stamp { background:linear-gradient(145deg,#ef4444,#991b1b); }.modular-badge-org_logo,.modular-badge-custom { background:var(--modular-bg);border:3px solid var(--modular-primary); }
    .modular-badge-ring { width:100%;height:100%;border:2px solid rgba(92,59,7,.45);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#5b3b08; }.modular-badge-ring span { font:700 8px Cinzel,serif;letter-spacing:.08em; }.modular-badge-ring strong { font:700 15px Cinzel,serif; }.modular-badge-ring small { font-size:8px;letter-spacing:.1em; }
    .modular-badge-ring img { width:100%;height:100%;border-radius:50%;object-fit:contain; }
    .modular-credential { position:absolute;right:76px;bottom:63px;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid color-mix(in srgb,var(--modular-text) 15%,transparent);background:rgba(255,255,255,.5); }.modular-qr { font-size:27px;line-height:1; }.modular-credential>span:last-child { display:flex;flex-direction:column;text-align:left; }.modular-credential small { font:600 7px Cinzel,serif;letter-spacing:.1em; }.modular-credential strong { margin-top:2px;font:600 8px Inter,sans-serif; }
    .modular-credential-bottom_left { right:auto;left:76px; }.modular-credential-center_footer { right:auto;left:50%;transform:translateX(-50%); }.modular-credential-top_right { top:62px;bottom:auto; }
    [data-position-mode='custom'] { display:flex;align-items:center;justify-content:center; }
  `;

  return { body, styles };
};
