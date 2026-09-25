export const CERTIFICATE_SEQ_PLACEHOLDER = '{seq}';
export const CERTIFICATE_YEAR_PLACEHOLDER = '{year}';
export const CERTIFICATE_MONTH_PLACEHOLDER = '{month}';
export const CERTIFICATE_SEQ_TAIL_LENGTH = 4;
export const CERTIFICATE_FALLBACK_SEQ_LENGTH = 6;
export const CERTIFICATE_FALLBACK_DEFAULT = '0001';

export const DEFAULT_CERTIFICATE_ID_FORMAT = `N° ${CERTIFICATE_SEQ_PLACEHOLDER}`;

/** Sample sequence used for editor/thumbnail previews (renders as `N° 0247` by default). */
export const CERTIFICATE_PREVIEW_SEQ = '0247';

export function ensureCertificateIdFormat(format?: string): string {
  return format?.trim() ? format : DEFAULT_CERTIFICATE_ID_FORMAT;
}

/**
 * Renders a certificate ID from an `idFormat` template by replacing `{seq}`
 * (last 4 alphanumeric chars of the sequence, uppercased), `{year}` and `{month}`.
 * Shared by course + learning-path preview renders and the issue flow so seeded
 * ids match what the API would generate.
 */
export function formatCertificateId(format: string | undefined, seq: string, issuedAt: Date): string {
  const year = issuedAt.getFullYear();
  const month = String(issuedAt.getMonth() + 1).padStart(2, '0');
  const tail = seq.replace(/-/g, '').slice(-CERTIFICATE_SEQ_TAIL_LENGTH).toUpperCase() || CERTIFICATE_FALLBACK_DEFAULT;

  return ensureCertificateIdFormat(format)
    .split(CERTIFICATE_SEQ_PLACEHOLDER)
    .join(tail)
    .split(CERTIFICATE_YEAR_PLACEHOLDER)
    .join(String(year))
    .split(CERTIFICATE_MONTH_PLACEHOLDER)
    .join(month);
}

/**
 * Deterministic stand-in sequence for preview renders where no student or
 * member id exists yet (last 6 digits of epoch millis). Not unique — the
 * persisted issue flow uses the member id plus a random retry suffix instead.
 */
export function fallbackSequence(issuedAt: Date): string {
  return String(issuedAt.getTime()).slice(-CERTIFICATE_FALLBACK_SEQ_LENGTH);
}
