import type { CertificateTemplateId } from '@cio/certificates';

export interface OrgCertificatePreset {
  id: string;
  orgId?: string;
  name: string;
  description?: string | null;
  design?: Record<string, any> | null;
  isActive?: boolean | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type ToolCategory = 'layout' | 'borders' | 'typography' | 'badges' | 'qrcode' | 'signatories' | 'background';

export type SelectedElement =
  | 'border'
  | 'recipient'
  | 'title'
  | 'body'
  | 'badge'
  | 'qrcode'
  | 'signatories'
  | 'background'
  | 'layout';

export type TypographyTarget = 'title' | 'recipient' | 'body';

export interface CertificateStudioProps {
  orgSlug: string;
  preset?: OrgCertificatePreset | null;
  starterTemplateId?: CertificateTemplateId;
  initialName?: string;
  initialAccentColor?: string;
  initialSubtitle?: string;
  onSaveSuccess?: (preset: OrgCertificatePreset) => void;
  onBack?: () => void;
}

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
