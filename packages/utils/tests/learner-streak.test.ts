import { describe, expect, it } from 'vitest';

import {
  addDays,
  computeActivityStreak,
  isWeekendDay,
  localDayKey,
  localHour,
  recentStreakDays,
  resolveTimeZone,
  startOfIsoWeek,
  streakMilestones,
  toIsoTimestamp
} from '../src/functions/learner-streak';

// 2024-01-01 is a Monday; 2024-01-06 and 2024-01-07 are the weekend.
describe('localDayKey', () => {
  it('counts a late-evening lesson on the learner’s local day', () => {
    const at = '2024-01-02T04:30:00Z';

    expect(localDayKey(at, 'America/New_York')).toBe('2024-01-01');
    expect(localDayKey(at, 'UTC')).toBe('2024-01-02');
  });

  it('moves early-morning UTC activity forward for zones ahead of UTC', () => {
    expect(localDayKey('2024-01-01T22:00:00Z', 'Africa/Lagos')).toBe('2024-01-01');
    expect(localDayKey('2024-01-01T23:30:00Z', 'Asia/Tokyo')).toBe('2024-01-02');
  });

  it('accepts Postgres timestamp strings', () => {
    expect(localDayKey('2024-01-01 23:30:00+00', 'UTC')).toBe('2024-01-01');
  });

  it('falls back to UTC for an unknown zone', () => {
    expect(resolveTimeZone('Not/AZone')).toBe('UTC');
    expect(localDayKey('2024-01-01T23:30:00Z', 'Not/AZone')).toBe('2024-01-01');
  });

  it('reads the local hour', () => {
    expect(localHour(new Date('2024-01-01T18:00:00Z'), 'Africa/Lagos')).toBe(19);
  });
});

describe('day helpers', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('knows weekends', () => {
    expect(isWeekendDay('2024-01-06')).toBe(true);
    expect(isWeekendDay('2024-01-07')).toBe(true);
    expect(isWeekendDay('2024-01-08')).toBe(false);
  });

  it('finds the Monday of the ISO week', () => {
    expect(startOfIsoWeek('2024-01-07')).toBe('2024-01-01');
    expect(startOfIsoWeek('2024-01-08')).toBe('2024-01-08');
    expect(startOfIsoWeek('2024-01-03')).toBe('2024-01-01');
  });
});

describe('computeActivityStreak', () => {
  it('is zero without activity', () => {
    expect(computeActivityStreak([], '2024-01-03')).toEqual({
      current: 0,
      best: 0,
      activeToday: false,
      lastActiveDay: null
    });
  });

  it('counts consecutive weekdays including today', () => {
    const streak = computeActivityStreak(['2024-01-01', '2024-01-02', '2024-01-03'], '2024-01-03');

    expect(streak.current).toBe(3);
    expect(streak.best).toBe(3);
    expect(streak.activeToday).toBe(true);
  });

  it('keeps the streak when today has no activity yet', () => {
    const streak = computeActivityStreak(['2024-01-01', '2024-01-02'], '2024-01-03');

    expect(streak.current).toBe(2);
    expect(streak.activeToday).toBe(false);
  });

  it('breaks on a missed weekday', () => {
    const streak = computeActivityStreak(['2024-01-01', '2024-01-03'], '2024-01-04');

    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
  });

  it('never breaks on a weekend without activity', () => {
    const streak = computeActivityStreak(['2024-01-04', '2024-01-05', '2024-01-08'], '2024-01-08');

    expect(streak.current).toBe(3);
  });

  it('counts weekend activity', () => {
    const streak = computeActivityStreak(['2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08'], '2024-01-08');

    expect(streak.current).toBe(4);
  });

  it('keeps a Friday streak alive on Monday before any activity', () => {
    const streak = computeActivityStreak(['2024-01-04', '2024-01-05'], '2024-01-08');

    expect(streak.current).toBe(2);
    expect(streak.activeToday).toBe(false);
  });

  it('remembers the best streak after a break', () => {
    const streak = computeActivityStreak(
      ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-10', '2024-01-11'],
      '2024-01-11'
    );

    expect(streak.current).toBe(2);
    expect(streak.best).toBe(4);
    expect(streak.lastActiveDay).toBe('2024-01-11');
  });

  it('ignores activity after today', () => {
    const streak = computeActivityStreak(['2024-01-02', '2024-01-03'], '2024-01-02');

    expect(streak.current).toBe(1);
    expect(streak.lastActiveDay).toBe('2024-01-02');
  });
});

describe('recentStreakDays', () => {
  it('lists the last seven days oldest first', () => {
    const days = recentStreakDays(['2024-01-05', '2024-01-08'], '2024-01-08');

    expect(days.map((day) => day.date)).toEqual([
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
      '2024-01-08'
    ]);
    expect(days.filter((day) => day.active).map((day) => day.date)).toEqual(['2024-01-05', '2024-01-08']);
    expect(days.filter((day) => day.isWeekend).map((day) => day.date)).toEqual(['2024-01-06', '2024-01-07']);
  });
});

describe('toIsoTimestamp', () => {
  it('normalises Postgres timestamps to ISO UTC', () => {
    expect(toIsoTimestamp('2026-11-16 07:38:48.153611+00')).toBe('2026-11-16T07:38:48.153Z');
    expect(toIsoTimestamp('2026-11-16 09:00:00+01:00')).toBe('2026-11-16T08:00:00.000Z');
    expect(toIsoTimestamp('2026-11-19 07:38:46.15')).toBe('2026-11-19T07:38:46.150Z');
    expect(toIsoTimestamp(null)).toBeNull();
    expect(toIsoTimestamp('not a date')).toBeNull();
  });
});

describe('streakMilestones', () => {
  it('marks milestones reached by the best streak and counts down the rest from the current streak', () => {
    const milestones = streakMilestones({ current: 5, best: 8 });

    expect(milestones).toEqual([
      { days: 3, achieved: true, daysRemaining: 0 },
      { days: 7, achieved: true, daysRemaining: 0 },
      { days: 14, achieved: false, daysRemaining: 9 },
      { days: 30, achieved: false, daysRemaining: 25 },
      { days: 60, achieved: false, daysRemaining: 55 },
      { days: 100, achieved: false, daysRemaining: 95 }
    ]);
  });
});
