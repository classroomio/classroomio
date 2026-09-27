import { t } from '$lib/utils/functions/translations';

/** Formats a duration in days as a human-readable string: "9.4 wks", "3.2 days", etc. */
export function formatAvgTime(days: number | null | undefined): string {
  if (days === null || days === undefined || days === 0) return '—';
  if (days >= 7) return t.get('learningPath.analytics.stat.avg_time_weeks', { value: (days / 7).toFixed(1) });
  return t.get('learningPath.analytics.stat.avg_time_days', { value: days.toFixed(1) });
}
