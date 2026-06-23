import { resolveTemplateId } from '@cio/certificates';
import { DEFAULT_CERTIFICATE_THEME_ID, type CertificateThemeId } from './constants';
import { t } from '$lib/utils/functions/translations';

/**
 * Resolves a stored theme/template id. Maps legacy 6-theme ids onto the new
 * 5 Atelier templates via `LEGACY_THEME_MAP`; unknown values fall back to
 * `DEFAULT_CERTIFICATE_THEME_ID`.
 */
export function parseCertificateThemeId(raw: string | null | undefined): CertificateThemeId {
  if (raw == null || raw === '') return DEFAULT_CERTIFICATE_THEME_ID;

  return resolveTemplateId(raw);
}

export type BlockerData = {
  code: string;
  params?: Record<string, string | number>;
};

export function formatBlockerMessage(blocker: BlockerData): string {
  const p = blocker.params ?? {};
  switch (blocker.code) {
    case 'CERT_PROGRESS':
      return t.get('course.certification.blocker_progress', {
        current: Number(p.current ?? 0),
        required: Number(p.required ?? 0)
      });
    case 'CERT_DEADLINE_PASSED':
      return t.get('course.certification.blocker_deadline');
    case 'CERT_NO_CONTENT':
      return t.get('course.certification.blocker_no_content');
    case 'CERT_FINAL_EXERCISE_NOT_SUBMITTED':
      return t.get('course.certification.blocker_final_not_submitted', {
        exerciseTitle: String(p.exerciseTitle ?? '')
      });
    case 'CERT_FINAL_EXERCISE_PENDING_GRADE':
      return t.get('course.certification.blocker_final_pending', {
        exerciseTitle: String(p.exerciseTitle ?? '')
      });
    case 'CERT_FINAL_EXERCISE_SCORE':
      return t.get('course.certification.blocker_final_score', {
        exerciseTitle: String(p.exerciseTitle ?? ''),
        bestPercent: Number(p.bestPercent ?? 0),
        requiredPercent: Number(p.requiredPercent ?? 0)
      });
    case 'CERT_FINAL_EXERCISE_MISCONFIGURED':
      return t.get('course.certification.blocker_final_misconfigured', {
        exerciseTitle: String(p.exerciseTitle ?? '')
      });
    default:
      return blocker.code;
  }
}

/** Normalizes DB/API timestamps to an ISO-8601 UTC string accepted by Zod `.datetime()`. */
export function normalizeCertificateIssuedAt(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();

  return parsed.toISOString();
}
