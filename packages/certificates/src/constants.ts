import type { CertificateDesign, CertificateTemplateId, CertificateTemplateMeta } from './types';

export const ACCENT_COLORS = ['#7a1f1f', '#1e3a8a', '#ff4500', '#d4af37', '#0a0a0a', '#065f46'] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export const DEFAULT_ACCENT_COLOR: string = ACCENT_COLORS[0];

export const CERTIFICATE_TEMPLATES: CertificateTemplateMeta[] = [
  {
    id: 'classique',
    label: 'Classique',
    description: 'Vintage engraved with double-rule border and seal.'
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Raw editorial grid with oversized typography and stamp.'
  },
  {
    id: 'noir',
    label: 'Noir',
    description: 'Dark editorial layout with gilt accents and medal.'
  },
  {
    id: 'poster',
    label: 'Poster',
    description: 'Maximalist editorial with colour blobs and rotated tag.'
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Refined Swiss layout with thin rules and pure typography.'
  }
];

/**
 * Maps the legacy 6 theme ids onto the new 5 templates.
 * Existing courses keep rendering until they are re-saved.
 */
export const LEGACY_THEME_MAP: Record<string, CertificateTemplateId> = {
  professional: 'classique',
  plain: 'minimal',
  purpleProfessionalBadge: 'noir',
  blueProfessionalBadge: 'noir',
  purpleBadgePattern: 'poster',
  blueBadgePattern: 'poster'
};

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesign = {
  templateId: 'classique',
  accentColor: DEFAULT_ACCENT_COLOR,
  subtitle: 'Awarded with Highest Distinction',
  signatories: [
    { name: 'Course Facilitator', role: 'Facilitator', enabled: true },
    { name: 'Organization Lead', role: 'Director', enabled: true }
  ],
  idFormat: 'N° {seq}'
};
