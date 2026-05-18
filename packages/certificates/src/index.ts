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
  LEGACY_THEME_MAP,
  type AccentColor
} from './constants';

export { renderCertificate, renderCertificateDocument, resolveTemplateId } from './render';
