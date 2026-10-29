export {
  CERTIFICATE_TEMPLATE_IDS,
  type CertificateDesign,
  type CertificateDocumentSignatory,
  type CertificateDocumentV1,
  type CertificatePresentationV1,
  type CertificateRenderData,
  type CertificateRenderResult,
  type CertificateSignatory,
  type CertificateTemplateId,
  type CertificateTemplateMeta,
  type StoredCertificateDesign,
  type StoredCertificateRecord,
  type StoredCertificateSignatory
} from './types';

export {
  ACCENT_COLORS,
  CERTIFICATE_HEIGHT,
  CERTIFICATE_PDF_PAGE_OPTIONS,
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_VIEWPORT,
  CERTIFICATE_WIDTH,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CERTIFICATE_DESIGN,
  FONTS_READY_CLASS,
  FONTS_READY_SELECTOR,
  LEGACY_THEME_MAP,
  type AccentColor
} from './constants';

export {
  renderCertificate,
  renderCertificateDocument,
  renderCertificatePresentation,
  renderCertificatePresentationDocument,
  resolveCertificateDesign,
  resolveTemplateId
} from './render';
export {
  getCertificateDocumentIdFormat,
  getStudioCertificateIdFormat,
  isCertificateDocumentV1,
  isStudioDesign,
  renderCertificateDocumentV1,
  renderStudioCertificate
} from './studio';
export {
  computeFitFontSize,
  computeFieldFontSizes,
  CERTIFICATE_FONTS,
  type CertificateFontFamily,
  type FitFontSizeOptions
} from './font-metrics';
export { FONTS_LINK_HREF } from './templates/shared';
