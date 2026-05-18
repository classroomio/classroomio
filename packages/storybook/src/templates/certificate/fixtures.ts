import {
  ACCENT_COLORS,
  CERTIFICATE_TEMPLATES,
  DEFAULT_CERTIFICATE_DESIGN,
  type CertificateDesign,
  type CertificateRenderData,
  type CertificateTemplateId
} from '@cio/certificates';

export const CERTIFICATE_TEMPLATE_LIST = CERTIFICATE_TEMPLATES;

export const SAMPLE_RENDER_DATA: CertificateRenderData = {
  recipientName: 'Eleanor Vance',
  courseName: 'Certificate of Excellence',
  courseDescription:
    'In recognition of outstanding achievement and exemplary dedication to the craft of design and storytelling.',
  orgName: 'The Royal Academy of Arts',
  date: 'October 12, 2026',
  certificateId: 'N° 0247'
};

export const LONG_RENDER_DATA: CertificateRenderData = {
  recipientName: 'Maximilian Alexandros Constantinopoulos',
  courseName: 'Advanced Editorial Layout & Typography for the Digital Era',
  courseDescription:
    'Awarded after sustained mastery of advanced editorial layout, typography, color theory, motion craft, and the careful coordination of a multi-stage production.',
  orgName: 'The International Atelier of Design & Storytelling',
  date: 'February 03, 2026',
  certificateId: 'N° 9991'
};

export const MINIMAL_RENDER_DATA: CertificateRenderData = {
  recipientName: 'Jo',
  courseName: 'Intro',
  courseDescription: 'Successfully completed the introductory programme.',
  orgName: 'CIO',
  date: 'May 11, 2026',
  certificateId: 'N° 0001'
};

export function buildDesign(
  templateId: CertificateTemplateId,
  overrides: Partial<CertificateDesign> = {}
): CertificateDesign {
  return {
    templateId,
    accentColor: overrides.accentColor ?? DEFAULT_CERTIFICATE_DESIGN.accentColor,
    subtitle: overrides.subtitle ?? DEFAULT_CERTIFICATE_DESIGN.subtitle,
    descriptionOverride: overrides.descriptionOverride,
    signatories: overrides.signatories ?? [
      { name: 'Margaret W. Holloway', role: 'Director of Studies' },
      { name: 'James K. Reeves', role: 'Dean of Faculty' }
    ],
    idFormat: overrides.idFormat ?? DEFAULT_CERTIFICATE_DESIGN.idFormat
  };
}

export const STORY_ACCENT_VARIATIONS = ACCENT_COLORS;
