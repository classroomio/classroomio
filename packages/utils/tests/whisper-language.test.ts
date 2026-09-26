import { describe, expect, it } from 'vitest';

import { normalizeWhisperLanguage } from '../src/functions/whisper-language';

describe('normalizeWhisperLanguage', () => {
  it('maps the language name that overflowed varchar(8) to its code', () => {
    expect(normalizeWhisperLanguage('ukrainian')).toBe('uk');
  });

  it('maps names longer than 8 characters used by ClassroomIO locales', () => {
    expect(normalizeWhisperLanguage('portuguese')).toBe('pt');
    expect(normalizeWhisperLanguage('vietnamese')).toBe('vi');
    expect(normalizeWhisperLanguage('indonesian')).toBe('id');
  });

  it('maps short names and ignores case and spacing', () => {
    expect(normalizeWhisperLanguage('english')).toBe('en');
    expect(normalizeWhisperLanguage('  French ')).toBe('fr');
    expect(normalizeWhisperLanguage('Haitian Creole')).toBe('ht');
  });

  it('keeps a value that is already a language code', () => {
    expect(normalizeWhisperLanguage('en')).toBe('en');
    expect(normalizeWhisperLanguage('yue')).toBe('yue');
  });

  it('falls back to und for missing or unknown values', () => {
    expect(normalizeWhisperLanguage(undefined)).toBe('und');
    expect(normalizeWhisperLanguage(null)).toBe('und');
    expect(normalizeWhisperLanguage('')).toBe('und');
    expect(normalizeWhisperLanguage('klingon-standard')).toBe('und');
  });

  it('prefers jv over the IANA-deprecated jw for Javanese', () => {
    expect(normalizeWhisperLanguage('javanese')).toBe('jv');
  });

  it('maps every name the backfill relies on, so no known language degrades to und', () => {
    const namesWithKnownCodes = [
      'persian',
      'catalan',
      'serbian',
      'welsh',
      'albanian',
      'armenian',
      'bulgarian',
      'croatian',
      'estonian',
      'georgian',
      'icelandic',
      'latvian',
      'lithuanian',
      'macedonian',
      'nepali',
      'slovak',
      'slovenian',
      'tibetan'
    ];

    for (const name of namesWithKnownCodes) {
      expect(normalizeWhisperLanguage(name), `${name} should not degrade to und`).not.toBe('und');
    }
  });
});
