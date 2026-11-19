import { describe, expect, it } from 'vitest';

import { getLocalizedDueStatus } from '../src/core/student-email';

describe('getLocalizedDueStatus', () => {
  it('uses locale-aware relative day forms for Russian and Polish', () => {
    expect(getLocalizedDueStatus(2, 'ru')).toContain('послезавтра');
    expect(getLocalizedDueStatus(5, 'ru')).toContain('через 5 дней');
    expect(getLocalizedDueStatus(2, 'pl')).toContain('pojutrze');
    expect(getLocalizedDueStatus(5, 'pl')).toContain('za 5 dni');
  });

  it('uses relative tomorrow wording and preserves overdue copy', () => {
    expect(getLocalizedDueStatus(1, 'en')).toBe('This goal is due tomorrow.');
    expect(getLocalizedDueStatus(0, 'en')).toBe('This goal is overdue.');
  });
});
