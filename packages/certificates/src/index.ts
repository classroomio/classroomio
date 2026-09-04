export {
  CERTIFICATE_TEMPLATE_IDS,
  type CertificateDesign,
  type CertificateRenderData,
  type CertificateRenderResult,
  type CertificateSignatory,
  type CertificateTemplateId,
  type CertificateTemplateMeta
} from './types';

export {
  ACCENT_COLORS,
  CERTIFICATE_TEMPLATES,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CERTIFICATE_DESIGN,
  FONTS_READY_CLASS,
  FONTS_READY_SELECTOR,
  LEGACY_THEME_MAP,
  type AccentColor
} from './constants';

export { renderCertificate, renderCertificateDocument, resolveTemplateId } from './render';
export {
  computeFitFontSize,
  computeFieldFontSizes,
  CERTIFICATE_FONTS,
  type CertificateFontFamily,
  type FitFontSizeOptions
} from './font-metrics';
export { FONTS_LINK_HREF } from './templates/shared';
