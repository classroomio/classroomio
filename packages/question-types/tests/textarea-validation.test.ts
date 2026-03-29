import { describe, expect, it } from 'vitest';
import {
  getTextareaAnswerCharacterCount,
  getTextareaAnswerText,
  getTextareaCharacterLimits,
  sanitizeTextareaCharacterLimit,
  validateTextareaAnswer
} from '../src';

describe('textarea validation helpers', () => {
  it('extracts plain text from rich-text HTML', () => {
    expect(getTextareaAnswerText('<p>Hello&nbsp;<strong>world</strong></p><p>Again</p>')).toBe('Hello world\nAgain');
    expect(getTextareaAnswerCharacterCount('<p>Hello&nbsp;<strong>world</strong></p><p>Again</p>')).toBe(17);
  });

  it('normalizes min and max character settings', () => {
    expect(getTextareaCharacterLimits({ minCharacters: '10', maxCharacters: '5' })).toEqual({
      minCharacters: 10,
      maxCharacters: 10
    });
  });

  it('sanitizes individual character limit values', () => {
    expect(sanitizeTextareaCharacterLimit('12.9')).toBe(12);
    expect(sanitizeTextareaCharacterLimit(-1)).toBeUndefined();
    expect(sanitizeTextareaCharacterLimit('abc')).toBeUndefined();
  });

  it('rejects answers below the minimum', () => {
    expect(validateTextareaAnswer('<p>Short</p>', { minCharacters: 10 })).toMatchObject({
      characterCount: 5,
      isValid: false,
      reason: 'below_min',
      minCharacters: 10
    });
  });

  it('rejects answers above the maximum', () => {
    expect(validateTextareaAnswer('<p>This is too long</p>', { maxCharacters: 4 })).toMatchObject({
      characterCount: 16,
      isValid: false,
      reason: 'above_max',
      maxCharacters: 4
    });
  });

  it('accepts answers within the configured range', () => {
    expect(validateTextareaAnswer('<p>Just right</p>', { minCharacters: 5, maxCharacters: 15 })).toMatchObject({
      characterCount: 10,
      isValid: true,
      reason: null,
      minCharacters: 5,
      maxCharacters: 15
    });
  });
});
