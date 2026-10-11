export const EARLY_ADOPTER_OFFER = {
  endsAt: '2026-11-30',
  postPath: '/blog/early-adopter'
} as const;

export type EarlyAdopterUrgency = 'open' | 'closing' | 'final' | 'today' | 'ended';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CLOSING_WINDOW_DAYS = 14;

function toUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Whole UTC days between `now` and the last day of the offer; 0 on the last day, negative once it has ended.
 */
export function getEarlyAdopterDaysLeft(now: Date = new Date()): number {
  const lastDay = Date.parse(`${EARLY_ADOPTER_OFFER.endsAt}T00:00:00Z`);

  return Math.round((lastDay - toUtcDay(now)) / MS_PER_DAY);
}

export function isEarlyAdopterOfferActive(now: Date = new Date()): boolean {
  return getEarlyAdopterDaysLeft(now) >= 0;
}

export function getEarlyAdopterUrgency(now: Date = new Date()): EarlyAdopterUrgency {
  const daysLeft = getEarlyAdopterDaysLeft(now);

  if (daysLeft < 0) return 'ended';
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'final';
  if (daysLeft <= CLOSING_WINDOW_DAYS) return 'closing';

  return 'open';
}
