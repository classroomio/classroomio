import type { BuiltInCertificateTemplateId } from './constants';
import type {
  TCertificateBadgeConfigV1,
  TCertificateBackgroundConfigV1,
  TCertificateBorderConfigV1,
  TCertificateCopyOverridesV1,
  TCertificateDesignV1,
  TCertificateElementLayoutV1,
  TCertificateQrCodeConfigV1,
  TCertificateSignatoryV1,
  TCertificateTypographyConfigV1
} from './schema';

export type CertificateTemplateId = BuiltInCertificateTemplateId | (string & {});

export type CertificateSignatoryV1 = TCertificateSignatoryV1;
export type CertificateBorderConfigV1 = TCertificateBorderConfigV1;
export type CertificateTypographyConfigV1 = TCertificateTypographyConfigV1;
export type CertificateBackgroundConfigV1 = TCertificateBackgroundConfigV1;
export type CertificateBadgeConfigV1 = TCertificateBadgeConfigV1;
export type CertificateQrCodeConfigV1 = TCertificateQrCodeConfigV1;
export type CertificateElementLayoutV1 = TCertificateElementLayoutV1;
export type CertificateCopyOverridesV1 = TCertificateCopyOverridesV1;
export type CertificateDesignV1 = TCertificateDesignV1;

export interface CertificatePreviewData {
  recipientName: string;
  courseName: string;
  courseDescription: string;
  orgName: string;
  orgLogoUrl?: string;
  date: string;
  certificateId: string;
}

export interface CertificatePreviewResult {
  html: string;
  styles: string;
}

export interface StarterTemplateMeta {
  id: CertificateTemplateId;
  name: string;
  style: string;
  description: string;
  accentColor: string;
  subtitle: string;
  initialDesign: CertificateDesignV1;
}

export type CertificateDesign = CertificateDesignV1;
export type CertificateRenderData = CertificatePreviewData;
export type CertificateSignatory = CertificateSignatoryV1;
export type CertificateRenderResult = CertificatePreviewResult;
