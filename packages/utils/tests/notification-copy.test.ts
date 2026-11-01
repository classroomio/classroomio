import { describe, expect, it } from 'vitest';

import { NOTIFICATION_TYPES } from '../src/constants/notifications';
import { EMAIL_LOCALES } from '../src/email';
import {
  describeDue,
  describeStart,
  renderNotificationCopy,
  toNotificationCopyLocale
} from '../src/functions/notification-copy';
import { NOTIFICATION_COPY_MESSAGES } from '../src/functions/notification-copy-messages';

const now = new Date('2026-10-31T12:00:00Z');

const base = {
  courseTitle: 'SOC 2 Security Basics',
  actorName: 'Daniel Mensah',
  subjectTitle: 'Section 2 check',
  dueAt: null,
  startsAt: null,
  completedCount: null,
  requiredCount: null
};

describe('renderNotificationCopy', () => {
  it('renders a non-empty title for every type, even without data', () => {
    for (const type of NOTIFICATION_TYPES) {
      const copy = renderNotificationCopy(
        {
          type,
          courseTitle: null,
          actorName: null,
          subjectTitle: null,
          dueAt: null,
          startsAt: null,
          completedCount: null,
          requiredCount: null
        },
        now
      );

      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.title).not.toMatch(/null|undefined/);
    }
  });

  it('renders deadline reminders relative to now', () => {
    const copy = renderNotificationCopy({ ...base, type: 'compliance_due_soon', dueAt: '2026-11-07T12:00:00Z' }, now);

    expect(copy.title).toBe('SOC 2 Security Basics is due in 7 days');
  });

  it('names the actor on replies', () => {
    expect(renderNotificationCopy({ ...base, type: 'community_answer' }, now)).toEqual({
      title: 'Daniel Mensah answered your question',
      body: 'Section 2 check'
    });
  });

  it('shows cohort goal progress', () => {
    const copy = renderNotificationCopy(
      { ...base, type: 'cohort_goal_due', dueAt: '2026-11-09T12:00:00Z', completedCount: 13, requiredCount: 18 },
      now
    );

    expect(copy).toEqual({ title: 'Section 2 check is due in 9 days', body: '13 of 18 courses done' });
  });
});

describe('describeDue', () => {
  it('covers today, tomorrow and past', () => {
    expect(describeDue('2026-10-31T18:00:00Z', now)).toBe('due tomorrow');
    expect(describeDue('2026-10-31T12:00:00Z', now)).toBe('due today');
    expect(describeDue('2026-10-29T12:00:00Z', now)).toBe('was due 2 days ago');
  });
});

describe('describeStart', () => {
  it('rounds to minutes, hours and days', () => {
    expect(describeStart('2026-10-31T12:45:00Z', now)).toBe('starts in 45 minutes');
    expect(describeStart('2026-10-31T13:00:00Z', now)).toBe('starts in 1 hour');
    expect(describeStart('2026-11-02T12:00:00Z', now)).toBe('starts in 2 days');
    expect(describeStart('2026-10-31T11:00:00Z', now)).toBe('has started');
  });
});

function placeholdersOf(message: string | Record<string, string | undefined>) {
  const forms = typeof message === 'string' ? [message] : Object.values(message).filter(Boolean);

  return forms.map((form) =>
    [...form!.matchAll(/\{(\w+)\}/g)]
      .map((match) => match[1])
      .sort()
      .join(',')
  );
}

describe('notification copy translations', () => {
  it('cover every English key with the same placeholders and message shape', () => {
    const english = NOTIFICATION_COPY_MESSAGES.en;

    for (const locale of EMAIL_LOCALES) {
      const messages = NOTIFICATION_COPY_MESSAGES[locale];
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());

      for (const [key, source] of Object.entries(english)) {
        const translated = messages[key as keyof typeof english];
        expect(typeof translated, `${locale}.${key}`).toBe(typeof source);

        const expected = placeholdersOf(source)[0];
        for (const found of placeholdersOf(translated)) {
          expect(found, `${locale}.${key}`).toBe(expected);
        }
      }
    }
  });

  it('renders every type without empty or unfilled text in every language', () => {
    for (const locale of EMAIL_LOCALES) {
      for (const type of NOTIFICATION_TYPES) {
        const copy = renderNotificationCopy(
          {
            ...base,
            type,
            dueAt: '2026-11-03T12:00:00Z',
            startsAt: '2026-10-31T14:00:00Z',
            completedCount: 2,
            requiredCount: 5
          },
          now,
          locale
        );

        expect(copy.title.length, `${locale}.${type}`).toBeGreaterThan(0);
        expect(`${copy.title} ${copy.body ?? ''}`, `${locale}.${type}`).not.toMatch(/\{\w+\}|null|undefined/);
      }
    }
  });

  it('renders in the reader language and keeps user data untranslated', () => {
    expect(renderNotificationCopy({ ...base, type: 'community_answer' }, now, 'de')).toEqual({
      title: 'Daniel Mensah hat Ihre Frage beantwortet',
      body: 'Section 2 check'
    });
    expect(
      renderNotificationCopy({ ...base, type: 'compliance_due_soon', dueAt: '2026-11-07T12:00:00Z' }, now, 'fr').title
    ).toBe('SOC 2 Security Basics : à terminer dans 7 jours');
  });

  it('picks Russian and Polish plural forms', () => {
    expect(describeDue('2026-11-01T12:00:00Z', new Date('2026-10-10T12:00:00Z'), 'ru')).toBe('срок через 22 дня');
    expect(describeDue('2026-11-05T12:00:00Z', now, 'ru')).toBe('срок через 5 дней');
    expect(describeDue('2026-10-10T12:00:00Z', now, 'ru')).toBe('просрочено на 21 день');
    expect(describeStart('2026-10-31T12:02:00Z', now, 'pl')).toBe('początek za 2 minuty');
    expect(describeStart('2026-10-31T12:12:00Z', now, 'pl')).toBe('początek za 12 minut');
    expect(describeStart('2026-10-31T13:00:00Z', now, 'pl')).toBe('początek za 1 godzinę');
  });

  it('falls back to English for missing or unsupported locales', () => {
    expect(toNotificationCopyLocale('pt-BR')).toBe('pt');
    expect(toNotificationCopyLocale('ja')).toBe('en');
    expect(toNotificationCopyLocale(null)).toBe('en');
    expect(renderNotificationCopy({ ...base, type: 'newsfeed_reply' }, now, 'xx').title).toBe(
      'Daniel Mensah replied to your comment'
    );
  });
});
