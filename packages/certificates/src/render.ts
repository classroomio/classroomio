import {
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_WIDTH,
  DEFAULT_CERTIFICATE_DESIGN,
  FONTS_READY_CLASS,
  LEGACY_THEME_MAP
} from './constants';
import type {
  CertificateDesign,
  CertificateRenderData,
  CertificateRenderResult,
  CertificateTemplateId,
  StoredCertificateRecord
} from './types';
import { isDefinedCertificateTemplate, type CertificateTemplateDefinition } from '@cio/sdk';
import { CERTIFICATE_TEMPLATE_IDS } from './types';
import { renderBrutalist } from './templates/brutalist';
import { renderClassique } from './templates/classique';
import { renderMinimal } from './templates/minimal';
import { renderNoir } from './templates/noir';
import { renderPoster } from './templates/poster';
import { BASE_STYLES, escapeHtml, FONTS_LINK_HREF, type TemplateRenderer } from './templates/shared';

const RENDERERS: Record<string, TemplateRenderer> = {
  classique: renderClassique,
  brutalist: renderBrutalist,
  noir: renderNoir,
  poster: renderPoster,
  minimal: renderMinimal
};

const BUILT_IN_TEMPLATE_IDS = new Set<string>(CERTIFICATE_TEMPLATE_IDS);
const PLACEHOLDER_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g;
const DEFAULT_DECLARATIVE_LABELS = {
  certificateTitle: 'CERTIFICATE OF COMPLETION',
  completionLabel: 'FOR SUCCESSFUL COMPLETION OF',
  presentedToLabel: 'THIS IS PROUDLY PRESENTED TO',
  verifiedCredentialLabel: 'VERIFIED CREDENTIAL'
};

function interpolateTemplate(source: string, values: Record<string, string>): string {
  return source.replace(PLACEHOLDER_PATTERN, (_placeholder, token: string) => values[token] ?? '');
}

function createDeclarativeRenderer(template: CertificateTemplateDefinition): TemplateRenderer {
  return ({ design, data }) => {
    const signatoryOne = design.signatories[0];
    const signatoryTwo = design.signatories[1];
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(design.accentColor) ? design.accentColor : '#d4af37';
    const labels = {
      certificateTitle: data.labels?.certificateTitle ?? DEFAULT_DECLARATIVE_LABELS.certificateTitle,
      completionLabel: data.labels?.completionLabel ?? DEFAULT_DECLARATIVE_LABELS.completionLabel,
      presentedToLabel: data.labels?.presentedToLabel ?? DEFAULT_DECLARATIVE_LABELS.presentedToLabel,
      verifiedCredentialLabel:
        data.labels?.verifiedCredentialLabel ?? DEFAULT_DECLARATIVE_LABELS.verifiedCredentialLabel
    };
    const textValues = {
      certificateTitle: labels.certificateTitle,
      certificateId: data.certificateId,
      completionLabel: labels.completionLabel,
      courseDescription: design.descriptionOverride || data.courseDescription,
      courseName: data.courseName,
      date: data.date,
      orgName: data.orgName,
      presentedToLabel: labels.presentedToLabel,
      recipientName: data.recipientName,
      signatoryOneName: signatoryOne?.enabled ? signatoryOne.name : '',
      signatoryOneRole: signatoryOne?.enabled ? signatoryOne.role : '',
      signatoryOneState: signatoryOne?.enabled ? 'enabled' : 'disabled',
      signatoryTwoName: signatoryTwo?.enabled ? signatoryTwo.name : '',
      signatoryTwoRole: signatoryTwo?.enabled ? signatoryTwo.role : '',
      signatoryTwoState: signatoryTwo?.enabled ? 'enabled' : 'disabled',
      subtitle: design.subtitle ?? '',
      verifiedCredentialLabel: labels.verifiedCredentialLabel
    };
    const escapedValues = Object.fromEntries(
      Object.entries(textValues).map(([key, value]) => [key, escapeHtml(value)])
    );
    const values = { ...escapedValues, accentColor };

    return {
      body: interpolateTemplate(template.body, values),
      styles: interpolateTemplate(template.styles, values)
    };
  };
}

/** Registers SDK-validated, data-only templates with the host rendering engine. */
export function registerCertificateTemplates(templates: readonly CertificateTemplateDefinition[]): void {
  for (const template of templates) {
    if (!isDefinedCertificateTemplate(template)) {
      throw new Error('Certificate templates must be created with defineCertificateTemplate().');
    }

    if (BUILT_IN_TEMPLATE_IDS.has(template.id)) {
      throw new Error(`Certificate template "${template.id}" cannot replace a built-in template.`);
    }

    RENDERERS[template.id] = createDeclarativeRenderer(template);

    const existingIndex = CERTIFICATE_TEMPLATES.findIndex((candidate) => candidate.id === template.id);
    const metadata = {
      id: template.id as CertificateTemplateId,
      label: template.label,
      description: template.description
    };

    if (existingIndex >= 0) {
      CERTIFICATE_TEMPLATES[existingIndex] = metadata;
    } else {
      CERTIFICATE_TEMPLATES.push(metadata);
    }
  }
}

export function resolveTemplateId(value: string | undefined | null): CertificateTemplateId {
  if (!value) return 'classique';
  if (value in RENDERERS) {
    return value as CertificateTemplateId;
  }
  if (value in LEGACY_THEME_MAP) {
    return LEGACY_THEME_MAP[value]!;
  }

  return 'classique';
}

/**
 * Coerces a stored `course.certificate` record, resolving legacy themes and
 * missing fields into a complete `CertificateDesign` suitable for `renderCertificate`.
 */
export function resolveCertificateDesign(stored?: StoredCertificateRecord | null): CertificateDesign {
  const design = stored?.design;
  const legacyTheme = stored?.theme ?? undefined;
  const templateId = resolveTemplateId(design?.templateId ?? legacyTheme);

  const accentColor =
    design?.accentColor && /^#[0-9a-fA-F]{6}$/.test(design.accentColor)
      ? design.accentColor
      : DEFAULT_CERTIFICATE_DESIGN.accentColor;

  const storedSignatories = Array.isArray(design?.signatories) ? design.signatories : undefined;

  const signatories: CertificateDesign['signatories'] = [
    {
      name: storedSignatories?.[0]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].name,
      role: storedSignatories?.[0]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].role,
      enabled: storedSignatories?.[0]?.enabled ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].enabled,
      signatureUrl: storedSignatories?.[0]?.signatureUrl
    },
    {
      name: storedSignatories?.[1]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].name,
      role: storedSignatories?.[1]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].role,
      enabled: storedSignatories?.[1]?.enabled ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].enabled,
      signatureUrl: storedSignatories?.[1]?.signatureUrl
    }
  ];

  return {
    templateId,
    accentColor,
    subtitle: design?.subtitle ?? DEFAULT_CERTIFICATE_DESIGN.subtitle,
    descriptionOverride: design?.descriptionOverride,
    signatories,
    idFormat: design?.idFormat ?? DEFAULT_CERTIFICATE_DESIGN.idFormat
  };
}

export function renderCertificate(design: CertificateDesign, data: CertificateRenderData): CertificateRenderResult {
  const templateId = resolveTemplateId(design.templateId);
  const renderer = RENDERERS[templateId];
  const { body, styles } = renderer({ design: { ...design, templateId }, data });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${CERTIFICATE_WIDTH},initial-scale=1.0">
  <title>Certificate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_LINK_HREF}">
</head>
<body>
${body}
<script>
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      document.documentElement.classList.add('${FONTS_READY_CLASS}');
    }).catch(function() {
      document.documentElement.classList.add('${FONTS_READY_CLASS}');
    });
  } else {
    document.documentElement.classList.add('${FONTS_READY_CLASS}');
  }
</script>
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
