export {
  ACCENT_COLORS,
  BUILTIN_CERTIFICATE_TEMPLATE_IDS,
  CERTIFICATE_HEIGHT,
  CERTIFICATE_VIEWPORT,
  CERTIFICATE_WIDTH,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CERTIFICATE_DESIGN_V1,
  FONTS_LINK_HREF,
  FONTS_READY_CLASS,
  FONT_OPTIONS,
  PALETTE_SWATCHES,
  type BuiltInCertificateTemplateId
} from './constants';

export {
  HEX_COLOR_PATTERN,
  ZCertificateBadgeConfigV1,
  ZCertificateBackgroundConfigV1,
  ZCertificateBorderConfigV1,
  ZCertificateCopyOverridesV1,
  ZCertificateDesignV1,
  ZCertificateElementLayoutV1,
  ZCertificateQrCodeConfigV1,
  ZCertificateSignatoryV1,
  ZCertificateTypographyConfigV1,
  ZHexColor,
  ZSafeUrl,
  type TCertificateBadgeConfigV1,
  type TCertificateBackgroundConfigV1,
  type TCertificateBorderConfigV1,
  type TCertificateCopyOverridesV1,
  type TCertificateDesignV1,
  type TCertificateElementLayoutV1,
  type TCertificateQrCodeConfigV1,
  type TCertificateSignatoryV1,
  type TCertificateTypographyConfigV1
} from './schema';

export type {
  CertificateBadgeConfigV1,
  CertificateBackgroundConfigV1,
  CertificateBorderConfigV1,
  CertificateCopyOverridesV1,
  CertificateDesignV1,
  CertificateElementLayoutV1,
  CertificatePreviewData,
  CertificatePreviewResult,
  CertificateQrCodeConfigV1,
  CertificateSignatoryV1,
  CertificateTemplateId,
  CertificateTypographyConfigV1,
  StarterTemplateMeta
} from './types';

export {
  isCertificateDesignV1,
  normalizeCertificateDesign,
  validateCertificateDesign,
  resolveTemplateId,
  STARTER_TEMPLATES
} from './normalize';

export { renderCertificatePreview, renderCertificatePreviewDocument } from './preview';
