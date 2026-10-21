import { describe, expect, it } from 'vitest';
import {
  VIDEO_LEVEL_LANGUAGE_KEY,
  isVideoLevelUnavailableReason,
  normalizeCaptionLanguage,
  resolveRequestLanguage
} from '@cio/core/services/youtube-captions/language';

describe('normalizeCaptionLanguage', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['EN', 'en'],
    ['en_GB', 'en'],
    ['pt-BR', 'pt'],
    ['zh-Hans-CN', 'zh']
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeCaptionLanguage(input)).toBe(expected);
  });

  it.each([undefined, null, '', '   ', '123', '-'])('falls back to en for %s', (input) => {
    expect(normalizeCaptionLanguage(input)).toBe('en');
  });

  it('fits the varchar(8) language column', () => {
    expect(normalizeCaptionLanguage('abcdefghijklmnop')).toHaveLength(8);
  });

  it('is idempotent, so a written key always matches the next read key', () => {
    const once = normalizeCaptionLanguage('en-US');

    expect(normalizeCaptionLanguage(once)).toBe(once);
  });

  it('makes the read key equal the write key across regional variants of one language', () => {
    // The bug this guards: lookup on `en` never matched a row written as `en-US`,
    // so every request re-billed the provider for the same video.
    const readKey = resolveRequestLanguage(['en']);
    const writeKey = normalizeCaptionLanguage('en-US');

    expect(readKey).toBe(writeKey);
  });
});

describe('resolveRequestLanguage', () => {
  it('uses the first preference only — one provider call means one language', () => {
    expect(resolveRequestLanguage(['fr-CA', 'en', 'de'])).toBe('fr');
  });

  it.each([undefined, []])('defaults to en for %s', (input) => {
    expect(resolveRequestLanguage(input)).toBe('en');
  });
});

describe('isVideoLevelUnavailableReason', () => {
  it.each(['no_captions', 'private', 'disabled'])('treats %s as a property of the video', (reason) => {
    expect(isVideoLevelUnavailableReason(reason)).toBe(true);
  });

  it.each(['not_found', 'async_pending', 'provider_error', 'other'])(
    'keeps %s scoped to the requested language',
    (reason) => {
      expect(isVideoLevelUnavailableReason(reason)).toBe(false);
    }
  );

  it('uses a video-level key that cannot collide with a real language subtag', () => {
    expect(normalizeCaptionLanguage(VIDEO_LEVEL_LANGUAGE_KEY)).not.toBe(VIDEO_LEVEL_LANGUAGE_KEY);
    expect(VIDEO_LEVEL_LANGUAGE_KEY.length).toBeLessThanOrEqual(8);
  });
});
