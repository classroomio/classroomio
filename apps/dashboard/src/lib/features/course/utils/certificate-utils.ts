import { CERTIFICATE_THEME_IDS, DEFAULT_CERTIFICATE_THEME_ID, type CertificateThemeId } from './constants';

const CERTIFICATE_THEME_ID_SET = new Set<string>(CERTIFICATE_THEME_IDS);

export function parseCertificateThemeId(raw: string | null | undefined): CertificateThemeId {
  if (raw != null && raw !== '' && CERTIFICATE_THEME_ID_SET.has(raw)) {
    return raw as CertificateThemeId;
  }
  return DEFAULT_CERTIFICATE_THEME_ID;
}
