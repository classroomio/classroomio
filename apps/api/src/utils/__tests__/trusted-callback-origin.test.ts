import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { isVerifiedCustomDomainHostname } = vi.hoisted(() => ({
  isVerifiedCustomDomainHostname: vi.fn<[string], Promise<boolean>>()
}));

vi.mock('@cio/db/queries/organization/organization', () => ({
  getVerifiedCustomDomainHostnames: vi.fn(async () => []),
  isVerifiedCustomDomainHostname
}));

import {
  resolveTrustedCallbackOrigin,
  trustCustomDomainHostname,
  untrustCustomDomainHostname
} from '@cio/db/utils/custom-domain/trusted-origin';

const STATIC_ENTRIES = ['https://*.classroomio.com', 'https://*.myclassroomio.com'];

beforeEach(() => {
  isVerifiedCustomDomainHostname.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveTrustedCallbackOrigin', () => {
  it('trusts a verified custom domain missing from the in-memory registry', async () => {
    isVerifiedCustomDomainHostname.mockResolvedValue(true);

    const origin = await resolveTrustedCallbackOrigin(
      'https://verified-missing.example/lms/mylearning?',
      STATIC_ENTRIES
    );

    expect(origin).toBe('https://verified-missing.example');
    expect(isVerifiedCustomDomainHostname).toHaveBeenCalledWith('verified-missing.example');
  });

  it('caches a verified domain so later callbacks skip the database', async () => {
    isVerifiedCustomDomainHostname.mockResolvedValue(true);

    await resolveTrustedCallbackOrigin('https://cached-verified.example/a', STATIC_ENTRIES);
    await resolveTrustedCallbackOrigin('https://cached-verified.example/b', STATIC_ENTRIES);

    expect(isVerifiedCustomDomainHostname).toHaveBeenCalledTimes(1);
  });

  it('does not query the database for a domain already in the registry', async () => {
    trustCustomDomainHostname('registered.example');

    const origin = await resolveTrustedCallbackOrigin('https://registered.example/x', STATIC_ENTRIES);

    expect(origin).toBe('https://registered.example');
    expect(isVerifiedCustomDomainHostname).not.toHaveBeenCalled();

    untrustCustomDomainHostname('registered.example');
  });

  it('rejects unknown and unverified hosts', async () => {
    isVerifiedCustomDomainHostname.mockResolvedValue(false);

    const origin = await resolveTrustedCallbackOrigin('https://attacker.example/steal', STATIC_ENTRIES);

    expect(origin).toBeUndefined();
  });

  it('rejects non-https callbacks even for verified domains', async () => {
    isVerifiedCustomDomainHostname.mockResolvedValue(true);

    const origin = await resolveTrustedCallbackOrigin('http://plain-http.example/x', STATIC_ENTRIES);

    expect(origin).toBeUndefined();
    expect(isVerifiedCustomDomainHostname).not.toHaveBeenCalled();
  });

  it('accepts first-party callbacks without a database lookup', async () => {
    const origin = await resolveTrustedCallbackOrigin('https://academy.myclassroomio.com/courses', STATIC_ENTRIES);

    expect(origin).toBe('https://academy.myclassroomio.com');
    expect(isVerifiedCustomDomainHostname).not.toHaveBeenCalled();
  });

  it('returns undefined for missing, relative and malformed callbacks', async () => {
    expect(await resolveTrustedCallbackOrigin(undefined, STATIC_ENTRIES)).toBeUndefined();
    expect(await resolveTrustedCallbackOrigin(null, STATIC_ENTRIES)).toBeUndefined();
    expect(await resolveTrustedCallbackOrigin('/lms/mylearning', STATIC_ENTRIES)).toBeUndefined();
    expect(await resolveTrustedCallbackOrigin('not a url', STATIC_ENTRIES)).toBeUndefined();
    expect(isVerifiedCustomDomainHostname).not.toHaveBeenCalled();
  });

  it('remembers unverified hosts briefly so repeated callbacks skip the database', async () => {
    vi.useFakeTimers();
    isVerifiedCustomDomainHostname.mockResolvedValue(false);

    await resolveTrustedCallbackOrigin('https://repeat-junk.example/a', STATIC_ENTRIES);
    await resolveTrustedCallbackOrigin('https://repeat-junk.example/b', STATIC_ENTRIES);

    expect(isVerifiedCustomDomainHostname).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(61_000);
    await resolveTrustedCallbackOrigin('https://repeat-junk.example/c', STATIC_ENTRIES);

    expect(isVerifiedCustomDomainHostname).toHaveBeenCalledTimes(2);
  });

  it('trusts a recently rejected host once it is marked verified', async () => {
    isVerifiedCustomDomainHostname.mockResolvedValue(false);
    await resolveTrustedCallbackOrigin('https://just-verified.example/a', STATIC_ENTRIES);

    trustCustomDomainHostname('just-verified.example');
    const origin = await resolveTrustedCallbackOrigin('https://just-verified.example/a', STATIC_ENTRIES);

    expect(origin).toBe('https://just-verified.example');

    untrustCustomDomainHostname('just-verified.example');
  });
});
