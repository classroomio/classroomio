import { describe, expect, it } from 'vitest';
import { parseLaunchToken } from './main';

describe('parseLaunchToken', () => {
  it('reads the token from the player path', () => {
    expect(parseLaunchToken('/activity/player/abc123')).toBe('abc123');
  });

  it('decodes an encoded token', () => {
    expect(parseLaunchToken('/activity/player/abc%2F123')).toBe('abc/123');
  });

  it('throws without a token', () => {
    expect(() => parseLaunchToken('/activity/player/')).toThrow();
    expect(() => parseLaunchToken('/')).toThrow();
  });
});
