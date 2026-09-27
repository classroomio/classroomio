import type { CertificateTemplateId } from '@cio/certificates';

export type ToolCategory = 'layout' | 'borders' | 'typography' | 'badges' | 'qrcode' | 'signatories' | 'background';

export interface StarterTemplate {
  id: CertificateTemplateId;
  name: string;
  style: string;
  description: string;
  accentColor: string;
  subtitle: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'classique',
    name: 'Honors Diploma',
    style: 'Victorian',
    description: 'Traditional academic elegance with ornate borders, classic serif fonts, and gold leaf accents.',
    accentColor: '#d4af37',
    subtitle: 'Certificate of Achievement'
  },
  {
    id: 'poster',
    name: 'Modern Tech Badge',
    style: 'Art Deco',
    description: 'Geometric Bauhaus-inspired layout with bold framing, ideal for engineering and software courses.',
    accentColor: '#ff5722',
    subtitle: 'Verified Technical Credential'
  },
  {
    id: 'noir',
    name: 'Executive Master',
    style: 'Executive Noir',
    description: 'High-contrast dark atelier design tailored for executive leadership and professional certifications.',
    accentColor: '#d4af37',
    subtitle: 'Executive Leadership Diploma'
  },
  {
    id: 'minimal',
    name: 'Clean Fellowship',
    style: 'Minimalist',
    description: 'Contemporary typography with delicate hairline rules, generous whitespace, and pure simplicity.',
    accentColor: '#0a0a0a',
    subtitle: 'Professional Fellowship'
  },
  {
    id: 'brutalist',
    name: 'Architectural Certificate',
    style: 'Raw Modern',
    description: 'Bold typographic hierarchy and editorial structure tailored for design and creative disciplines.',
    accentColor: '#ff4500',
    subtitle: 'Certificate of Completion'
  }
];

export const PALETTE_SWATCHES = [
  '#D4AF37',
  '#85581A',
  '#1A1A2E',
  '#2563EB',
  '#059669',
  '#DC2626',
  '#7C3AED',
  '#475569'
];

export const FONT_OPTIONS = [
  { value: 'Great Vibes', label: 'Great Vibes (Script)' },
  { value: 'Bodoni Moda', label: 'Bodoni Moda (Editorial Serif)' },
  { value: 'Cinzel', label: 'Cinzel (Classical Roman)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (Graceful)' },
  { value: 'Playfair Display', label: 'Playfair Display (Traditional)' },
  { value: 'Inter', label: 'Inter (Modern Clean Sans)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (Tech Brutalist)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric Sans)' }
];
