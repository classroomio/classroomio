export const CERTIFICATE_WIDTH = 1100;
export const CERTIFICATE_HEIGHT = 780;

export const CERTIFICATE_VIEWPORT = {
  width: CERTIFICATE_WIDTH,
  height: CERTIFICATE_HEIGHT
} as const;

export const BUILTIN_CERTIFICATE_TEMPLATE_IDS = ['classique', 'brutalist', 'noir', 'poster', 'minimal'] as const;

export type BuiltInCertificateTemplateId = (typeof BUILTIN_CERTIFICATE_TEMPLATE_IDS)[number];

export const ACCENT_COLORS = ['#7a1f1f', '#1e3a8a', '#ff4500', '#d4af37', '#0a0a0a', '#065f46'] as const;

export const DEFAULT_ACCENT_COLOR = '#d4af37';

export const PALETTE_SWATCHES = [
  '#D4AF37',
  '#85581A',
  '#1A1A2E',
  '#2563EB',
  '#059669',
  '#DC2626',
  '#7C3AED',
  '#475569'
] as const;

export const FONT_OPTIONS = [
  { value: 'Great Vibes', label: 'Great Vibes (Script)' },
  { value: 'Bodoni Moda', label: 'Bodoni Moda (Editorial Serif)' },
  { value: 'Cinzel', label: 'Cinzel (Classical Roman)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (Graceful)' },
  { value: 'Playfair Display', label: 'Playfair Display (Traditional)' },
  { value: 'Inter', label: 'Inter (Modern Clean Sans)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (Tech Brutalist)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric Sans)' }
] as const;

export const FONTS_READY_CLASS = 'fonts-ready';

export const FONTS_LINK_HREF =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Great+Vibes&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&display=swap';

export const DEFAULT_CERTIFICATE_DESIGN_V1 = {
  version: 1 as const,
  templateId: 'classique' as const,
  accentColor: DEFAULT_ACCENT_COLOR,
  title: 'Certificate of Completion',
  subtitle: 'This is proudly presented to',
  descriptionOverride: '',
  idFormat: 'CIO-{YYYY}-{RANDOM}',
  signatories: [
    {
      id: 'sig-1',
      name: 'Academy Director',
      role: 'Head of Education',
      enabled: true
    },
    {
      id: 'sig-2',
      name: 'Lead Instructor',
      role: 'Course Instructor',
      enabled: true
    }
  ]
} as const;
