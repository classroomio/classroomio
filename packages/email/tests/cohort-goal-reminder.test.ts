import { describe, expect, it } from 'vitest';

import { cohortGoalReminderEmail } from '../src/emails/cohort-goal-reminder';

type SubjectFields = { goalTitle: string; daysUntilDue: number };

function resolveSubject(fields: SubjectFields, context?: { locale?: 'en' | 'fr' }): string {
  return (cohortGoalReminderEmail.template.subject as (input: SubjectFields, ctx?: typeof context) => string)(
    fields,
    context
  );
}

describe('cohortGoalReminderEmail subject', () => {
  it('uses overdue copy when the assignment is past due', () => {
    expect(resolveSubject({ goalTitle: 'Finish K1', daysUntilDue: -2 }, { locale: 'en' })).toBe(
      'Finish K1 — This goal is overdue.'
    );
  });

  it('uses due copy before the deadline', () => {
    expect(resolveSubject({ goalTitle: 'Finish K1', daysUntilDue: 3 }, { locale: 'en' })).toBe(
      'Finish K1 — This goal is due in 3 days.'
    );
  });

  it('localizes the due status', () => {
    expect(resolveSubject({ goalTitle: 'Terminer K1', daysUntilDue: -1 }, { locale: 'fr' })).toBe(
      'Terminer K1 — Cet objectif est en retard.'
    );
  });
});
