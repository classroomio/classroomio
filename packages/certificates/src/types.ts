export const CERTIFICATE_TEMPLATE_IDS = ['classique', 'brutalist', 'noir', 'poster', 'minimal'] as const;
export type BuiltInCertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];
export type CertificateTemplateId = BuiltInCertificateTemplateId | (string & {});

export interface CertificateSignatory {
  name: string;
  role: string;
  enabled: boolean;
  signatureUrl?: string;
}

export interface CertificateBorderConfig {
  style?: 'victorian' | 'double_gold' | 'geometric' | 'minimal' | 'custom_svg' | string;
  width?: number;
  primaryColor?: string;
  accentColor?: string;
  customSvg?: string;
}

export interface CertificateTypographyConfig {
  titleFont?: string;
  recipientFont?: string;
  bodyFont?: string;
  primaryColor?: string;
  letterSpacing?: number;
}

export interface CertificateBackgroundConfig {
  style?: 'parchment' | 'guilloche' | 'solid' | 'gradient' | string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface CertificateBadgeConfig {
  style?: 'gold_seal' | 'ribbon' | 'wax_stamp' | 'crest' | 'none' | string;
  label?: string;
  foilColor?: string;
}

export interface CertificateQrCodeConfig {
  enabled?: boolean;
  position?: 'bottom_right' | 'bottom_left' | 'center' | string;
}

export interface CertificateDesign {
  rendererTemplateId: CertificateTemplateId;
  templateId: CertificateTemplateId; // for backwards compatibility
  sourcePresetId?: string;
  accentColor: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories: [CertificateSignatory, CertificateSignatory];
  idFormat?: string;
  border?: CertificateBorderConfig;
  typography?: CertificateTypographyConfig;
  background?: CertificateBackgroundConfig;
  badge?: CertificateBadgeConfig;
  qrCode?: CertificateQrCodeConfig;
}

export interface StoredCertificateSignatory {
  name?: string;
  role?: string;
  enabled?: boolean;
  signatureUrl?: string;
}

export interface StoredCertificateDesign {
  rendererTemplateId?: CertificateTemplateId | string;
  sourcePresetId?: string;
  templateId?: CertificateTemplateId | string;
  accentColor?: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories?: StoredCertificateSignatory[];
  idFormat?: string;
  border?: CertificateBorderConfig;
  typography?: CertificateTypographyConfig;
  background?: CertificateBackgroundConfig;
  badge?: CertificateBadgeConfig;
  qrCode?: CertificateQrCodeConfig;
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
  labels?: Partial<CertificateRenderLabels>;
}

export interface CertificateRenderLabels {
  certificateTitle: string;
  completionLabel: string;
  presentedToLabel: string;
  verifiedCredentialLabel: string;
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
