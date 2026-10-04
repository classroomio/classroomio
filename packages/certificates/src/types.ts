export const CERTIFICATE_TEMPLATE_IDS = ['classique', 'brutalist', 'noir', 'poster', 'minimal'] as const;
export type BuiltInCertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];
export type CertificateTemplateId = BuiltInCertificateTemplateId | (string & {});

export interface CertificateSignatory {
  id?: string;
  name: string;
  role: string;
  enabled: boolean;
  signatureUrl?: string;
  signatureAssetId?: string;
}

export interface CertificateBorderConfig {
  style?: 'victorian' | 'double_gold' | 'geometric' | 'minimal' | 'custom_image';
  width?: number;
  primaryColor?: string;
  accentColor?: string;
  customImageUrl?: string;
}

export interface CertificateTypographyConfig {
  titleFont?: string;
  recipientFont?: string;
  bodyFont?: string;
  primaryColor?: string;
  letterSpacing?: number;
}

export interface CertificateBackgroundConfig {
  style?: 'parchment' | 'guilloche' | 'solid' | 'gradient';
  primaryColor?: string;
  secondaryColor?: string;
}

export interface CertificateBadgeConfig {
  style?: 'gold_seal' | 'ribbon' | 'wax_stamp' | 'crest' | 'custom' | 'none';
  label?: string;
  foilColor?: string;
  customImageUrl?: string;
}

export interface CertificateQrCodeConfig {
  enabled?: boolean;
  position?: 'bottom_right' | 'bottom_left' | 'center_footer' | 'top_right' | 'custom';
}

export interface CertificateLayoutConfig {
  headerOffsetY?: number;
  titleOffsetY?: number;
  recipientOffsetY?: number;
  courseOffsetY?: number;
  badgeOffsetY?: number;
  footerOffsetY?: number;
}

export type CertificateElementId =
  | 'header'
  | 'title'
  | 'subtitle'
  | 'recipient'
  | 'course'
  | 'description'
  | 'date'
  | 'badge'
  | 'signatories'
  | 'signatory-0'
  | 'signatory-1'
  | 'signatory-2'
  | 'qrCode'
  | 'border'
  | 'background';

export interface CertificateElementLayout {
  enabled?: boolean;
  positionMode?: 'auto' | 'custom';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  anchor?: 'top_left';
  zIndex?: number;
}

export type CertificateElements = Partial<Record<CertificateElementId, CertificateElementLayout>>;

export interface CertificateCopyOverrides {
  title?: string;
  presentation?: string;
  completion?: string;
  dateLabel?: string;
  verifiedCredentialLabel?: string;
  organizationName?: string;
}

export interface CertificateDesign {
  rendererTemplateId: CertificateTemplateId;
  templateId: CertificateTemplateId; // for backwards compatibility
  sourcePresetId?: string;
  accentColor: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories: CertificateSignatory[];
  idFormat?: string;
  elements?: CertificateElements;
  copy?: CertificateCopyOverrides;
  border?: CertificateBorderConfig;
  typography?: CertificateTypographyConfig;
  background?: CertificateBackgroundConfig;
  badge?: CertificateBadgeConfig;
  qrCode?: CertificateQrCodeConfig;
  layout?: CertificateLayoutConfig;
}

export interface StoredCertificateSignatory {
  id?: string;
  name?: string;
  role?: string;
  enabled?: boolean;
  signatureUrl?: string;
  signatureAssetId?: string;
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
  elements?: CertificateElements;
  copy?: CertificateCopyOverrides;
  border?: CertificateBorderConfig;
  typography?: CertificateTypographyConfig;
  background?: CertificateBackgroundConfig;
  badge?: CertificateBadgeConfig;
  qrCode?: CertificateQrCodeConfig;
  layout?: CertificateLayoutConfig;
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
