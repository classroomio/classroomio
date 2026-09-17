import { getRelativeDayLabelKey, groupVersionsByDay, hasVersionSessionSpan } from './lesson-version-utils';

import type { LessonVersionEntry } from './types';

function buildVersion(overrides: Partial<LessonVersionEntry> = {}): LessonVersionEntry {
  const timestamp = overrides.timestamp ?? new Date('2026-03-10T14:00:00Z');

  return {
    id: 1,
    newContent: '<p>new</p>',
    oldContent: '<p>old</p>',
    kind: 'auto',
    label: null,
    sessionStartedAt: timestamp,
    timestamp,
    editCount: 1,
    authorName: 'Ada Lovelace',
    locale: 'en',
    lessonId: 'lesson-1',
    ...overrides
  };
}

describe('groupVersionsByDay', () => {
  it('returns no groups for an empty history', () => {
    expect(groupVersionsByDay([])).toEqual([]);
  });

  it('collects versions from the same day into one group', () => {
    const groups = groupVersionsByDay([
      buildVersion({ id: 2, timestamp: new Date('2026-03-10T16:00:00') }),
      buildVersion({ id: 1, timestamp: new Date('2026-03-10T09:00:00') })
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.versions.map((version) => version.id)).toEqual([2, 1]);
  });

  it('splits across days and preserves newest-first order', () => {
    const groups = groupVersionsByDay([
      buildVersion({ id: 3, timestamp: new Date('2026-03-11T08:00:00') }),
      buildVersion({ id: 2, timestamp: new Date('2026-03-10T16:00:00') }),
      buildVersion({ id: 1, timestamp: new Date('2026-03-10T09:00:00') })
    ]);

    expect(groups.map((group) => group.versions.length)).toEqual([1, 2]);
    expect(groups[0]?.versions[0]?.id).toBe(3);
  });

  it('starts a new group when a day repeats after a gap', () => {
    const groups = groupVersionsByDay([
      buildVersion({ id: 3, timestamp: new Date('2026-03-11T08:00:00') }),
      buildVersion({ id: 2, timestamp: new Date('2026-03-10T16:00:00') }),
      buildVersion({ id: 1, timestamp: new Date('2026-03-11T09:00:00') })
    ]);

    expect(groups).toHaveLength(3);
  });
});

describe('getRelativeDayLabelKey', () => {
  const now = new Date('2026-03-11T10:00:00');

  it('labels the current day', () => {
    expect(getRelativeDayLabelKey(new Date('2026-03-11T23:00:00').getTime(), now)).toBe('today');
  });

  it('labels the previous day', () => {
    expect(getRelativeDayLabelKey(new Date('2026-03-10T01:00:00').getTime(), now)).toBe('yesterday');
  });

  it('leaves older days to a formatted date', () => {
    expect(getRelativeDayLabelKey(new Date('2026-03-08T12:00:00').getTime(), now)).toBeNull();
  });
});

describe('hasVersionSessionSpan', () => {
  it('is false for a session that is a single save', () => {
    const timestamp = new Date('2026-03-10T14:00:00');
    const version = buildVersion({ sessionStartedAt: timestamp, timestamp });

    expect(hasVersionSessionSpan(version)).toBe(false);
  });

  it('is true once the session spans at least a minute', () => {
    const version = buildVersion({
      sessionStartedAt: new Date('2026-03-10T14:00:00'),
      timestamp: new Date('2026-03-10T14:12:00')
    });

    expect(hasVersionSessionSpan(version)).toBe(true);
  });
});
