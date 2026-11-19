import { describe, expect, it } from 'vitest';

import {
  EARLY_ADOPTER_OFFER,
  getEarlyAdopterDaysLeft,
  getEarlyAdopterUrgency,
  isEarlyAdopterOfferActive
} from '../src/plans/early-adopter-offer';

const day = (date: string, time = '12:00:00Z') => new Date(`${date}T${time}`);

describe('early adopter offer', () => {
  it('ends on 2026-11-30', () => {
    expect(EARLY_ADOPTER_OFFER.endsAt).toBe('2026-11-30');
  });

  it('counts whole days left regardless of the time of day', () => {
    expect(getEarlyAdopterDaysLeft(day('2026-11-16', '00:00:00Z'))).toBe(14);
    expect(getEarlyAdopterDaysLeft(day('2026-11-16', '23:59:59Z'))).toBe(14);
    expect(getEarlyAdopterDaysLeft(day('2026-10-31'))).toBe(30);
  });

  it('is 0 on the last day and still active', () => {
    expect(getEarlyAdopterDaysLeft(day('2026-11-30', '23:59:59Z'))).toBe(0);
    expect(isEarlyAdopterOfferActive(day('2026-11-30', '23:59:59Z'))).toBe(true);
  });

  it('is inactive from the day after the end date', () => {
    expect(isEarlyAdopterOfferActive(day('2026-12-01', '00:00:00Z'))).toBe(false);
    expect(getEarlyAdopterDaysLeft(day('2026-12-01', '00:00:00Z'))).toBe(-1);
  });

  it('picks the urgency tier from the days left', () => {
    expect(getEarlyAdopterUrgency(day('2026-10-31'))).toBe('open');
    expect(getEarlyAdopterUrgency(day('2026-11-15'))).toBe('open');
    expect(getEarlyAdopterUrgency(day('2026-11-16'))).toBe('closing');
    expect(getEarlyAdopterUrgency(day('2026-11-28'))).toBe('closing');
    expect(getEarlyAdopterUrgency(day('2026-11-29'))).toBe('final');
    expect(getEarlyAdopterUrgency(day('2026-11-30'))).toBe('today');
    expect(getEarlyAdopterUrgency(day('2026-12-01'))).toBe('ended');
  });
});
