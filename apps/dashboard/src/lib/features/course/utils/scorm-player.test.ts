import { describe, expect, it } from 'vitest';

import { contentOriginOf, isTrustedPlayerMessage, parsePlayerMessage } from './scorm-utils';

describe('player message protocol', () => {
  it('parses the player events and drops anything else', () => {
    expect(parsePlayerMessage({ type: 'ready' })).toEqual({ type: 'ready' });
    expect(parsePlayerMessage({ type: 'initialized' })).toEqual({ type: 'initialized' });
    expect(parsePlayerMessage({ type: 'did-not-connect' })).toEqual({ type: 'did-not-connect' });
    expect(parsePlayerMessage({ type: 'terminated', navRequest: 'continue' })).toEqual({
      type: 'terminated',
      navRequest: 'continue'
    });
    expect(parsePlayerMessage({ type: 'terminated', navRequest: '' })).toEqual({
      type: 'terminated',
      navRequest: null
    });
    expect(parsePlayerMessage({ type: 'terminated' })).toEqual({ type: 'terminated', navRequest: null });
    expect(parsePlayerMessage({ type: 'boot-error', error: 'Launch state request failed: 401' })).toEqual({
      type: 'boot-error',
      error: 'Launch state request failed: 401'
    });
    expect(parsePlayerMessage({ type: 'boot-error' })).toEqual({ type: 'boot-error', error: null });
    expect(parsePlayerMessage(null)).toBeNull();
    expect(parsePlayerMessage('ready')).toBeNull();
    expect(parsePlayerMessage({ type: 'cmi', value: 1 })).toBeNull();
    expect(parsePlayerMessage({})).toBeNull();
  });

  it('trusts only the content origin the player launched from', () => {
    const playerUrl = 'https://abc123.classroomio-content.com/activity/player/token-1';

    expect(contentOriginOf(playerUrl)).toBe('https://abc123.classroomio-content.com');
    expect(contentOriginOf('not a url')).toBeNull();
    expect(isTrustedPlayerMessage('https://abc123.classroomio-content.com', playerUrl)).toBe(true);
    expect(isTrustedPlayerMessage('https://acme.myclassroomio.com', playerUrl)).toBe(false);
    expect(isTrustedPlayerMessage('https://abc123.classroomio-content.com.evil.com', playerUrl)).toBe(false);
    expect(isTrustedPlayerMessage('https://abc123.classroomio-content.com', 'not a url')).toBe(false);
  });
});
