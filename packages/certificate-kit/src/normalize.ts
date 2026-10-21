import { BUILTIN_CERTIFICATE_TEMPLATE_IDS, DEFAULT_ACCENT_COLOR, DEFAULT_CERTIFICATE_DESIGN_V1 } from './constants';
import { HEX_COLOR_PATTERN, ZCertificateDesignV1 } from './schema';
import type { CertificateDesignV1, CertificateTemplateId, StarterTemplateMeta } from './types';

export function resolveTemplateId(value: string | undefined | null): CertificateTemplateId {
  if (!value) return 'classique';
  if ((BUILTIN_CERTIFICATE_TEMPLATE_IDS as readonly string[]).includes(value)) {
    return value as CertificateTemplateId;
  }
  const LEGACY_MAP: Record<string, CertificateTemplateId> = {
    professional: 'classique',
    plain: 'minimal',
    academic: 'classique',
    modern: 'poster',
    dark: 'noir',
    bold: 'brutalist'
  };
  if (value in LEGACY_MAP) {
    return LEGACY_MAP[value]!;
  }
  return value as CertificateTemplateId;
}

export function isCertificateDesignV1(val: unknown): val is CertificateDesignV1 {
  return ZCertificateDesignV1.safeParse(val).success;
}

export function validateCertificateDesign(val: unknown): CertificateDesignV1 {
  const parsed = ZCertificateDesignV1.safeParse(val);
  if (parsed.success) return parsed.data;
  return normalizeCertificateDesign(val);
}

/**
 * Normalizes any raw design record or legacy format into a strictly valid CertificateDesignV1.
 */
export function normalizeCertificateDesign(raw: unknown): CertificateDesignV1 {
  const parseResult = ZCertificateDesignV1.safeParse(raw);
  if (parseResult.success) {
    return parseResult.data;
  }

  const candidate = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, any>;
  const templateId = resolveTemplateId(candidate.templateId ?? candidate.rendererTemplateId ?? candidate.theme);
  const accentColor =
    typeof candidate.accentColor === 'string' && HEX_COLOR_PATTERN.test(candidate.accentColor)
      ? candidate.accentColor
      : DEFAULT_ACCENT_COLOR;

  const rawSignatories = Array.isArray(candidate.signatories) ? candidate.signatories : [];
  const signatories =
    rawSignatories.length > 0
      ? rawSignatories.slice(0, 3).map((sig: any, index: number) => ({
          id: typeof sig?.id === 'string' ? sig.id : `sig-${index + 1}`,
          name: typeof sig?.name === 'string' ? sig.name.slice(0, 128) : '',
          role: typeof sig?.role === 'string' ? sig.role.slice(0, 128) : '',
          enabled: typeof sig?.enabled === 'boolean' ? sig.enabled : true,
          signatureUrl: typeof sig?.signatureUrl === 'string' ? sig.signatureUrl : undefined
        }))
      : DEFAULT_CERTIFICATE_DESIGN_V1.signatories.map((sig, idx) => ({ ...sig, id: `sig-${idx + 1}` }));

  const normalizedCandidate = {
    version: 1 as const,
    templateId,
    rendererTemplateId: typeof candidate.rendererTemplateId === 'string' ? candidate.rendererTemplateId : undefined,
    sourcePresetId: typeof candidate.sourcePresetId === 'string' ? candidate.sourcePresetId : undefined,
    accentColor,
    title: typeof candidate.title === 'string' ? candidate.title.slice(0, 128) : DEFAULT_CERTIFICATE_DESIGN_V1.title,
    subtitle:
      typeof candidate.subtitle === 'string'
        ? candidate.subtitle.slice(0, 128)
        : DEFAULT_CERTIFICATE_DESIGN_V1.subtitle,
    descriptionOverride:
      typeof candidate.descriptionOverride === 'string' ? candidate.descriptionOverride.slice(0, 1000) : '',
    idFormat:
      typeof candidate.idFormat === 'string' ? candidate.idFormat.slice(0, 64) : DEFAULT_CERTIFICATE_DESIGN_V1.idFormat,
    signatories,
    elements: candidate.elements && typeof candidate.elements === 'object' ? candidate.elements : undefined,
    border: candidate.border && typeof candidate.border === 'object' ? candidate.border : undefined,
    typography: candidate.typography && typeof candidate.typography === 'object' ? candidate.typography : undefined,
    background: candidate.background && typeof candidate.background === 'object' ? candidate.background : undefined,
    badge: candidate.badge && typeof candidate.badge === 'object' ? candidate.badge : undefined,
    qrCode: candidate.qrCode && typeof candidate.qrCode === 'object' ? candidate.qrCode : undefined,
    copy: candidate.copy && typeof candidate.copy === 'object' ? candidate.copy : undefined
  };

  const reparsed = ZCertificateDesignV1.safeParse(normalizedCandidate);
  if (reparsed.success) {
    return reparsed.data;
  }

  return {
    ...DEFAULT_CERTIFICATE_DESIGN_V1,
    signatories: [...DEFAULT_CERTIFICATE_DESIGN_V1.signatories]
  };
}

export const STARTER_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'classique',
    name: 'Honors Diploma',
    style: 'Victorian',
    description: 'Traditional academic elegance with ornate borders, classic serif fonts, and gold leaf accents.',
    accentColor: '#d4af37',
    subtitle: 'Certificate of Achievement',
    initialDesign: normalizeCertificateDesign({
      templateId: 'classique',
      accentColor: '#d4af37',
      title: 'Certificate of Achievement',
      subtitle: 'This is proudly presented to',
      border: { style: 'victorian', width: 14, primaryColor: '#d4af37' },
      badge: { style: 'gold_seal', label: 'HONORS' }
    })
  },
  {
    id: 'poster',
    name: 'Modern Tech Badge',
    style: 'Art Deco',
    description: 'Geometric Bauhaus-inspired layout with bold framing, ideal for engineering and software courses.',
    accentColor: '#ff5722',
    subtitle: 'Verified Technical Credential',
    initialDesign: normalizeCertificateDesign({
      templateId: 'poster',
      accentColor: '#ff5722',
      title: 'Technical Credential',
      subtitle: 'Issued upon successful completion to',
      border: { style: 'geometric', width: 8, primaryColor: '#ff5722' },
      badge: { style: 'ribbon', label: 'CERTIFIED' }
    })
  },
  {
    id: 'noir',
    name: 'Executive Master',
    style: 'Executive Noir',
    description: 'High-contrast dark atelier design tailored for executive leadership and professional certifications.',
    accentColor: '#d4af37',
    subtitle: 'Executive Leadership Diploma',
    initialDesign: normalizeCertificateDesign({
      templateId: 'noir',
      accentColor: '#d4af37',
      title: 'Executive Leadership Diploma',
      subtitle: 'Confers this honor to',
      background: { style: 'solid', primaryColor: '#090d16' },
      badge: { style: 'crest', label: 'DISTINCTION' }
    })
  },
  {
    id: 'minimal',
    name: 'Clean Fellowship',
    style: 'Minimalist',
    description: 'Contemporary typography with delicate hairline rules, generous whitespace, and pure simplicity.',
    accentColor: '#0a0a0a',
    subtitle: 'Professional Fellowship',
    initialDesign: normalizeCertificateDesign({
      templateId: 'minimal',
      accentColor: '#0a0a0a',
      title: 'Certificate of Completion',
      subtitle: 'Awarded to',
      border: { style: 'minimal', width: 2, primaryColor: '#0a0a0a' },
      badge: { style: 'none' }
    })
  },
  {
    id: 'brutalist',
    name: 'Architectural Certificate',
    style: 'Raw Modern',
    description: 'Bold typographic hierarchy and editorial structure tailored for design and creative disciplines.',
    accentColor: '#ff4500',
    subtitle: 'Certificate of Completion',
    initialDesign: normalizeCertificateDesign({
      templateId: 'brutalist',
      accentColor: '#ff4500',
      title: 'Design Qualification',
      subtitle: 'Awarded to',
      border: { style: 'geometric', width: 16, primaryColor: '#1a1a1a' },
      badge: { style: 'wax_stamp', label: 'ACCREDITED' }
    })
  }
];
