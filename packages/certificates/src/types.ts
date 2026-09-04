export const CERTIFICATE_TEMPLATE_IDS = ['classique', 'brutalist', 'noir', 'poster', 'minimal'] as const;
export type CertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];

export interface CertificateSignatory {
  name: string;
  role: string;
  enabled: boolean;
  signatureUrl?: string;
}

export interface CertificateDesign {
  templateId: CertificateTemplateId;
  accentColor: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories: [CertificateSignatory, CertificateSignatory];
  idFormat?: string;
}

export interface StoredCertificateSignatory {
  name?: string;
  role?: string;
  enabled?: boolean;
  signatureUrl?: string;
}

export interface StoredCertificateDesign {
  templateId?: CertificateTemplateId | string;
  accentColor?: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories?:
    | [StoredCertificateSignatory?, StoredCertificateSignatory?]
    | StoredCertificateSignatory[]
    | readonly StoredCertificateSignatory[];
  idFormat?: string;
}

/**
 * Shape of certificate metadata persisted in the database (e.g. `course.certificate`).
 */
export interface StoredCertificateRecord {
  isDownloadable?: boolean;
  theme?: string | null;
  design?: StoredCertificateDesign | null;
  [key: string]: unknown;
}

export interface CertificateRenderData {
  recipientName: string;
  courseName: string;
  courseDescription: string;
  orgName: string;
  orgLogoUrl?: string;
  date: string;
  certificateId: string;
}

export interface CertificateRenderResult {
  html: string;
  styles: string;
}

export interface CertificateTemplateMeta {
  id: CertificateTemplateId;
  label: string;
  description: string;
}
