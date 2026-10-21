import { CERTIFICATE_WIDTH, FONTS_LINK_HREF } from './constants';
import type { CertificateDesignV1, CertificatePreviewData, CertificatePreviewResult } from './types';
import { resolveTemplateId } from './normalize';
import { renderClassique } from './templates/classique';
import { renderBrutalist } from './templates/brutalist';
import { renderMinimal } from './templates/minimal';
import { renderNoir } from './templates/noir';
import { renderPoster } from './templates/poster';
import { renderModular } from './templates/modular';
import { BASE_STYLES, type TemplateRenderer } from './templates/shared';

const DEFAULT_PREVIEW_DATA: CertificatePreviewData = {
  recipientName: 'Jane Doe',
  courseName: 'Advanced Web Architecture & Systems Design',
  courseDescription:
    'For successfully demonstrating mastery of modern decoupled architectures, plugin ecosystems, and enterprise isolation patterns.',
  orgName: 'ClassroomIO Academy',
  orgLogoUrl: '',
  date: 'October 10, 2026',
  certificateId: 'CIO-2026-CERT-001'
};

const RENDERERS: Record<string, TemplateRenderer> = {
  classique: renderClassique,
  brutalist: renderBrutalist,
  noir: renderNoir,
  poster: renderPoster,
  minimal: renderMinimal,
  modular: renderModular
};

export function renderCertificatePreview(
  design: CertificateDesignV1,
  data?: Partial<CertificatePreviewData>
): CertificatePreviewResult {
  const mergedData: CertificatePreviewData = {
    ...DEFAULT_PREVIEW_DATA,
    ...(data ?? {})
  };

  const templateId = resolveTemplateId(design.rendererTemplateId || design.templateId);
  const renderer = RENDERERS[templateId] ?? renderClassique;

  const { body, styles } = renderer({
    design: {
      ...design,
      templateId
    },
    data: mergedData
  });

  return {
    html: body,
    styles: `${BASE_STYLES}\n${styles}`
  };
}

export function renderCertificatePreviewDocument(
  design: CertificateDesignV1,
  data?: Partial<CertificatePreviewData>
): string {
  const { html, styles } = renderCertificatePreview(design, data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${CERTIFICATE_WIDTH},initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:;">
  <title>Certificate Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_LINK_HREF}">
  <style>
    ${styles}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}
