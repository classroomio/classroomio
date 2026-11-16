import type { CertificateDesign, CertificateTemplateId, CertificateTemplateMeta } from './types';

export const CERTIFICATE_WIDTH = 1100;
export const CERTIFICATE_HEIGHT = 780;

export const CERTIFICATE_VIEWPORT = {
  width: CERTIFICATE_WIDTH,
  height: CERTIFICATE_HEIGHT
} as const;

export const CERTIFICATE_PDF_PAGE_OPTIONS = {
  width: `${CERTIFICATE_WIDTH}px`,
  height: `${CERTIFICATE_HEIGHT}px`,
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
} as const;

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
  idFormat: 'N° {seq}',
  verifyPlacements: {
    classique: { anchor: 'top-right' },
    brutalist: { anchor: 'bottom-right' },
    noir: { anchor: 'bottom-right' },
    poster: { anchor: 'bottom-right' },
    minimal: { anchor: 'bottom-right' }
  }
};

export const VERIFY_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type VerifyAnchor = (typeof VERIFY_ANCHORS)[number];

export const DEFAULT_VERIFY_POSITION: VerifyAnchor = 'top-right';

export const DEFAULT_VERIFY_PLACEMENTS: Record<CertificateTemplateId, { anchor: VerifyAnchor }> = {
  classique: { anchor: 'top-right' },
  brutalist: { anchor: 'bottom-right' },
  noir: { anchor: 'bottom-right' },
  poster: { anchor: 'bottom-right' },
  minimal: { anchor: 'bottom-right' }
};

export const TEMPLATE_VERIFY_OFFSETS: Record<
  CertificateTemplateId,
  Record<VerifyAnchor, { top?: number; right?: number; bottom?: number; left?: number }>
> = {
  classique: {
    'top-right': { top: 50, right: 110 },
    'top-left': { top: 50, left: 50 },
    'bottom-right': { bottom: 136, right: 110 },
    'bottom-left': { bottom: 136, left: 50 }
  },
  minimal: {
    'top-right': { top: 18, right: 160 },
    'top-left': { top: 18, left: 100 },
    'bottom-right': { bottom: 140, right: 160 },
    'bottom-left': { bottom: 140, left: 100 }
  },
  brutalist: {
    'top-right': { top: 87, right: 100 },
    'top-left': { top: 87, left: 45 },
    'bottom-right': { bottom: 210, right: 100 },
    'bottom-left': { bottom: 210, left: 45 }
  },
  noir: {
    'top-right': { top: 45, right: 115 },
    'top-left': { top: 45, left: 55 },
    'bottom-right': { bottom: 130, right: 115 },
    'bottom-left': { bottom: 130, left: 55 }
  },
  poster: {
    'top-right': { top: 120, right: 115 },
    'top-left': { top: 120, left: 55 },
    'bottom-right': { bottom: 250, right: 115 },
    'bottom-left': { bottom: 250, left: 55 }
  }
};

export const FONTS_READY_CLASS = 'fonts-ready';
export const FONTS_READY_SELECTOR = `.${FONTS_READY_CLASS}`;
