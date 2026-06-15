import { resolveTemplateId } from '@cio/certificates';
import { DEFAULT_CERTIFICATE_THEME_ID, type CertificateThemeId } from './constants';

/**
 * Resolves a stored theme/template id. Maps legacy 6-theme ids onto the new
 * 5 Atelier templates via `LEGACY_THEME_MAP`; unknown values fall back to
 * `DEFAULT_CERTIFICATE_THEME_ID`.
 */
export function parseCertificateThemeId(raw: string | null | undefined): CertificateThemeId {
  if (raw == null || raw === '') return DEFAULT_CERTIFICATE_THEME_ID;

  return resolveTemplateId(raw);
}

/** Normalizes DB/API timestamps to an ISO-8601 UTC string accepted by Zod `.datetime()`. */
export function normalizeCertificateIssuedAt(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();

  return parsed.toISOString();
}
