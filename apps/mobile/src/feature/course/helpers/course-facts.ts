import type { TCourseLevel } from '@cio/utils/constants/course-level';

import type { en } from '@/feature/course/translations/en';
import type { Translator } from '@/feature/i18n/helpers/translate';

const LEVEL_KEYS = {
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced'
} as const satisfies Record<TCourseLevel, keyof typeof en>;

export function levelLabel(level: string | null | undefined, t: Translator<typeof en>) {
  return level && level in LEVEL_KEYS ? t(LEVEL_KEYS[level as TCourseLevel]) : null;
}

/** A course length as "45 min" or "2.5 hr" in the app language. */
export function durationLabel(minutes: number | null | undefined, t: Translator<typeof en>, locale: string) {
  if (!minutes || minutes <= 0) return null;

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (minutes < 60) return t('durationMinutesShort', { minutes: number.format(minutes) });

  return t('durationHoursShort', { hours: number.format(Math.round((minutes / 60) * 2) / 2) });
}
