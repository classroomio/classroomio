import { describe, expect, it } from 'vitest';
import { applyTerminology } from '@cio/sdk';

// The locale word table maps semantic override keys to their word in each locale.
// This mimics what the real implementation reads from the locale JSON files.
const LOCALE_WORD_TABLE = {
  en: { course: 'Course', student: 'Student' },
  de: { course: 'Kurs', student: 'Student' },
  fr: { course: 'Cours', student: 'Étudiant' },
  pt: { course: 'Curso', student: 'Aluno' }
};

describe('applyTerminology — English locale', () => {
  it('returns the original string when no overrides are set', () => {
    expect(applyTerminology('Course', {}, 'en', LOCALE_WORD_TABLE)).toBe('Course');
  });

  it('substitutes the locale word when an override is set', () => {
    expect(applyTerminology('Course', { course: 'Module' }, 'en', LOCALE_WORD_TABLE)).toBe('Module');
  });

  it('substitutes all occurrences in a string', () => {
    expect(applyTerminology('Course list — add a Course', { course: 'Module' }, 'en', LOCALE_WORD_TABLE)).toBe(
      'Module list — add a Module'
    );
  });

  it('does not substitute partial word matches', () => {
    // 'Courses' should not become 'Modules' — only exact word matches
    expect(applyTerminology('Courses', { course: 'Module' }, 'en', LOCALE_WORD_TABLE)).toBe('Courses');
  });

  it('applies multiple overrides in a single pass', () => {
    expect(
      applyTerminology('Course for Student', { course: 'Module', student: 'Trainee' }, 'en', LOCALE_WORD_TABLE)
    ).toBe('Module for Trainee');
  });

  it('returns the original string when the locale word does not appear in the string', () => {
    expect(applyTerminology('Lesson overview', { course: 'Module' }, 'en', LOCALE_WORD_TABLE)).toBe('Lesson overview');
  });
});

describe('applyTerminology — German locale (core locale-awareness test)', () => {
  it('substitutes the German word for course with the override', () => {
    // This is THE critical test. A German user sets course → Module.
    // $t('course.title') resolves to 'Kurs'. The override must replace 'Kurs' with 'Module'.
    expect(applyTerminology('Kurs', { course: 'Module' }, 'de', LOCALE_WORD_TABLE)).toBe('Module');
  });

  it('substitutes in a multi-word German string', () => {
    expect(applyTerminology('Kurs hinzufügen', { course: 'Module' }, 'de', LOCALE_WORD_TABLE)).toBe(
      'Module hinzufügen'
    );
  });

  it('does not substitute if the override key is set but the locale word is not in the string', () => {
    expect(applyTerminology('Lektion hinzufügen', { course: 'Module' }, 'de', LOCALE_WORD_TABLE)).toBe(
      'Lektion hinzufügen'
    );
  });
});

describe('applyTerminology — French locale', () => {
  it('substitutes the French word for course with the override', () => {
    expect(applyTerminology('Cours', { course: 'Module' }, 'fr', LOCALE_WORD_TABLE)).toBe('Module');
  });
});

describe('applyTerminology — Portuguese locale', () => {
  it('substitutes the Portuguese word for course with the override', () => {
    expect(applyTerminology('Curso', { course: 'Module' }, 'pt', LOCALE_WORD_TABLE)).toBe('Module');
  });
});

describe('applyTerminology — edge cases', () => {
  it('handles an empty string input', () => {
    expect(applyTerminology('', { course: 'Module' }, 'en', LOCALE_WORD_TABLE)).toBe('');
  });

  it('returns the string unchanged when no terminology config is set', () => {
    expect(applyTerminology('Course', {}, 'en', LOCALE_WORD_TABLE)).toBe('Course');
  });

  it('returns the string unchanged for an unrecognised locale — no crash', () => {
    expect(() => applyTerminology('Course', { course: 'Module' }, 'xx', LOCALE_WORD_TABLE)).not.toThrow();
  });

  it('is case-preserving — the override value is used verbatim', () => {
    expect(applyTerminology('Course', { course: 'module' }, 'en', LOCALE_WORD_TABLE)).toBe('module');
  });
});
