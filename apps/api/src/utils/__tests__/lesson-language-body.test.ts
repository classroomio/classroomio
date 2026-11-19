import { describe, expect, it } from 'vitest';

import { pickLessonLanguageBody } from '@cio/db/queries/course';

describe('pickLessonLanguageBody', () => {
  it('prefers a non-empty English row over other locales', () => {
    const body = pickLessonLanguageBody(
      [
        { locale: 'fr', content: 'Bonjour' },
        { locale: 'en', content: 'Hello' }
      ],
      'legacy note'
    );

    expect(body).toBe('Hello');
  });

  it('falls back to a non-empty locale when the English row is empty', () => {
    const body = pickLessonLanguageBody(
      [
        { locale: 'en', content: '' },
        { locale: 'fr', content: 'Bonjour' }
      ],
      'legacy note'
    );

    expect(body).toBe('Bonjour');
  });

  it('falls back to the legacy note when every language row is empty', () => {
    const body = pickLessonLanguageBody(
      [
        { locale: 'en', content: '' },
        { locale: 'fr', content: null }
      ],
      'legacy note'
    );

    expect(body).toBe('legacy note');
  });
});
