import { describe, expect, it } from 'vitest';
import { contrastAgainstWhite, normaliseBrandColour } from '@cio/core/services/onboarding/brand-colour';
import { isPrivateAddress } from '@cio/core/services/onboarding/safe-fetch';

describe('normaliseBrandColour', () => {
  it('expands short hex and keeps a readable colour unchanged', () => {
    expect(normaliseBrandColour('#036')).toEqual({ hex: '#003366', adjusted: false });
  });

  it('darkens a colour until white text reaches 3:1', () => {
    const result = normaliseBrandColour('#ffee00');

    expect(result?.adjusted).toBe(true);
    expect(contrastAgainstWhite(result!.hex)).toBeGreaterThanOrEqual(3);
  });

  it('rejects values that are not hex colours', () => {
    expect(normaliseBrandColour('rebeccapurple')).toBeNull();
    expect(normaliseBrandColour('url(javascript:alert(1))')).toBeNull();
  });
});

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fd00::1',
    'fe80::1'
  ])('blocks %s', (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });

  it('blocks IPv4-mapped private addresses', () => {
    expect(isPrivateAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it.each(['::ffff:7f00:1', '::127.0.0.1', '64:ff9b::a00:1', '2002:c0a8:101::1', 'fec0::1', 'ff02::1', '::'])(
    'blocks IPv6 form %s that hides a private or reserved address',
    (address) => {
      expect(isPrivateAddress(address)).toBe(true);
    }
  );

  it.each(['::ffff:8.8.8.8', '64:ff9b::808:808', '2002:808:808::1', '2001:4860:4860::8888'])(
    'allows public IPv6 form %s',
    (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    }
  );
});
