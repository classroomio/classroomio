import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeWhisperLanguage } from './whisper-language';

test('maps the language name that overflowed varchar(8) to its code', () => {
  assert.equal(normalizeWhisperLanguage('ukrainian'), 'uk');
});

test('maps names longer than 8 characters used by ClassroomIO locales', () => {
  assert.equal(normalizeWhisperLanguage('portuguese'), 'pt');
  assert.equal(normalizeWhisperLanguage('vietnamese'), 'vi');
  assert.equal(normalizeWhisperLanguage('indonesian'), 'id');
});

test('maps short names and ignores case and spacing', () => {
  assert.equal(normalizeWhisperLanguage('english'), 'en');
  assert.equal(normalizeWhisperLanguage('  French '), 'fr');
  assert.equal(normalizeWhisperLanguage('Haitian Creole'), 'ht');
});

test('keeps a value that is already a language code', () => {
  assert.equal(normalizeWhisperLanguage('en'), 'en');
  assert.equal(normalizeWhisperLanguage('yue'), 'yue');
});

test('falls back to und for missing or unknown values', () => {
  assert.equal(normalizeWhisperLanguage(undefined), 'und');
  assert.equal(normalizeWhisperLanguage(null), 'und');
  assert.equal(normalizeWhisperLanguage(''), 'und');
  assert.equal(normalizeWhisperLanguage('klingon-standard'), 'und');
});
