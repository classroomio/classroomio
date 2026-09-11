import { describe, expect, it } from 'vitest';
import { captionReasonForSupadataError } from '@cio/core/services/youtube-captions/supadata-adapter';
import { isVideoLevelUnavailableReason } from '@cio/core/services/youtube-captions/language';

describe('captionReasonForSupadataError', () => {
  it.each([
    ['transcript-unavailable', 'no_captions'],
    ['not-found', 'not_found'],
    ['invalid-request', 'other']
  ])('maps terminal code %s to %s so it is cached instead of retried', (code, reason) => {
    expect(captionReasonForSupadataError(code)).toBe(reason);
  });

  it.each(['internal-error', 'limit-exceeded', 'unauthorized', 'upgrade-required'])(
    'returns null for %s so the job rethrows rather than caching an account-level failure',
    (code) => {
      expect(captionReasonForSupadataError(code)).toBeNull();
    }
  );

  it('does not cache a rate limit as an unavailable video', () => {
    // Caching this would mark the video captionless for the whole negative-cache
    // TTL because of a temporary quota problem.
    expect(captionReasonForSupadataError('limit-exceeded')).toBeNull();
  });

  it('caches a captions-disabled video at the video level, not per language', () => {
    const reason = captionReasonForSupadataError('transcript-unavailable');

    expect(reason).not.toBeNull();
    expect(isVideoLevelUnavailableReason(reason!)).toBe(true);
  });

  it('keeps not_found scoped to the requested language', () => {
    expect(isVideoLevelUnavailableReason('not_found')).toBe(false);
  });

  it('returns null for an unrecognized code rather than guessing', () => {
    expect(captionReasonForSupadataError('something-new')).toBeNull();
  });
});
