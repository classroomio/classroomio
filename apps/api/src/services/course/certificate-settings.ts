import type { TCourse } from '@cio/db/types';
import { resolveCertificateDesign } from '@api/utils/certificate';

const DEFAULT_THRESHOLD = 100;

type TCertificateCourse = Pick<TCourse, 'certificate'>;

/**
 * Returns the settings the dashboard shows and completion evaluation applies: stored values with defaults filled in.
 */
export function toEffectiveCertificateSettings(course: TCertificateCourse) {
  const stored = course.certificate ?? {};
  const design = resolveCertificateDesign(stored);

  return {
    isDownloadable: stored.isDownloadable ?? false,
    theme: stored.theme ?? design.templateId,
    design,
    deadline: stored.deadline ?? null,
    threshold: stored.threshold ?? DEFAULT_THRESHOLD,
    emailMessage: stored.emailMessage ?? null
  };
}
