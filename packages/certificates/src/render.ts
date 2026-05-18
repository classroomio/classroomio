import { LEGACY_THEME_MAP } from './constants';
import type { CertificateDesign, CertificateRenderData, CertificateRenderResult, CertificateTemplateId } from './types';
import { CERTIFICATE_TEMPLATE_IDS } from './types';
import { renderBrutalist } from './templates/brutalist';
import { renderClassique } from './templates/classique';
import { renderMinimal } from './templates/minimal';
import { renderNoir } from './templates/noir';
import { renderPoster } from './templates/poster';
import { BASE_STYLES, FONTS_LINK_HREF, type TemplateRenderer } from './templates/shared';

const RENDERERS: Record<CertificateTemplateId, TemplateRenderer> = {
  classique: renderClassique,
  brutalist: renderBrutalist,
  noir: renderNoir,
  poster: renderPoster,
  minimal: renderMinimal
};

export function resolveTemplateId(value: string | undefined | null): CertificateTemplateId {
  if (!value) return 'classique';
  if (CERTIFICATE_TEMPLATE_IDS.includes(value as CertificateTemplateId)) {
    return value as CertificateTemplateId;
  }
  if (value in LEGACY_THEME_MAP) {
    return LEGACY_THEME_MAP[value]!;
  }

  return 'classique';
}

export function renderCertificate(design: CertificateDesign, data: CertificateRenderData): CertificateRenderResult {
  const templateId = resolveTemplateId(design.templateId);
  const renderer = RENDERERS[templateId];
  const { body, styles } = renderer({ design: { ...design, templateId }, data });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1100,initial-scale=1.0">
  <title>Certificate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_LINK_HREF}">
</head>
<body>
${body}
</body>
</html>`;

  const fullStyles = BASE_STYLES + '\n' + styles;

  return { html, styles: fullStyles };
}

/**
 * Returns a single-document HTML string that already includes the styles inline.
 * Useful for iframe `srcdoc` and `<iframe>`-style previews where a separate
 * `addStyleTag` is not available.
 */
export function renderCertificateDocument(design: CertificateDesign, data: CertificateRenderData): string {
  const { html, styles } = renderCertificate(design, data);

  return html.replace('</head>', `<style>${styles}</style></head>`);
}
