import { describe, expect, it } from 'vitest';
import { PackageError } from '../errors.js';
import {
  isoWeekIndex,
  mintContentToken,
  mintLaunchToken,
  signToken,
  verifyContentToken,
  verifyLaunchToken,
  verifyToken
} from './index.js';

const SECRET = 'test-secret-'.repeat(4);
const NOW = Date.UTC(2026, 9, 9, 12, 0, 0);

describe('signToken', () => {
  it('round-trips and rejects tampering', async () => {
    const token = await signToken({ org: 'o1' }, SECRET);

    expect(await verifyToken(token, SECRET)).toEqual({ org: 'o1' });

    const [body, signature] = token.split('.');
    const tamperedBody = `${token.slice(0, 8)}x${token.slice(9)}`;

    for (const bad of [
      `${body}.x${signature.slice(1)}`,
      tamperedBody,
      'nope',
      await signToken({ org: 'o1' }, 'other')
    ]) {
      try {
        await verifyToken(bad, SECRET);
        expect.unreachable();
      } catch (error) {
        expect((error as PackageError).code).toBe('invalid_token');
      }
    }
  });
});

describe('launch tokens', () => {
  it('mints twelve-hour tokens', async () => {
    const token = await mintLaunchToken(
      {
        org: 'o1',
        act: 'a1',
        att: 't1',
        sub: 'p1',
        unit: 'u1',
        fmt: 'scorm2004_4',
        mode: 'normal',
        anc: ['https://a.example']
      },
      SECRET,
      NOW
    );
    const claims = await verifyLaunchToken(token, SECRET, NOW);

    expect(claims.exp - NOW / 1000).toBe(12 * 60 * 60);
    expect(claims.att).toBe('t1');
    expect(claims.typ).toBe('launch');

    try {
      await verifyLaunchToken(token, SECRET, NOW + 12 * 60 * 60 * 1000 + 1000);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('expired_token');
    }
  });

  it('rejects foreign or missing token types', async () => {
    const foreign = await signToken(
      {
        org: 'o1',
        act: 'a1',
        sub: 'p1',
        unit: 'u1',
        fmt: 'scorm12',
        mode: 'normal',
        anc: [],
        exp: Math.floor(NOW / 1000) + 3600,
        typ: 'content'
      },
      SECRET
    );

    try {
      await verifyLaunchToken(foreign, SECRET, NOW);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('invalid_token');
    }

    const untyped = await signToken(
      {
        org: 'o1',
        act: 'a1',
        sub: 'p1',
        unit: 'u1',
        fmt: 'scorm12',
        mode: 'normal',
        anc: [],
        exp: Math.floor(NOW / 1000) + 3600
      },
      SECRET
    );

    try {
      await verifyLaunchToken(untyped, SECRET, NOW);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('invalid_token');
    }
  });
});

describe('content tokens', () => {
  it('is deterministic per week and rolls over', async () => {
    const input = { org: 'o1', prefix: 'scorm/asset-1/v1', anc: ['https://a.example'] };
    const first = await mintContentToken(input, SECRET, NOW);
    const second = await mintContentToken(input, SECRET, NOW + 3600_000);

    expect(first).toBe(second);
    expect((await verifyContentToken(first, SECRET, { org: 'o1', prefix: 'scorm/asset-1/v1' }, NOW)).wk).toBe(
      isoWeekIndex(new Date(NOW))
    );

    const nextWeek = await mintContentToken(input, SECRET, NOW + 7 * 24 * 3600_000);

    expect(nextWeek).not.toBe(first);
    expect(
      await verifyContentToken(first, SECRET, { org: 'o1', prefix: 'scorm/asset-1/v1' }, NOW + 7 * 24 * 3600_000)
    ).toBeTruthy();

    try {
      await verifyContentToken(first, SECRET, { org: 'o1', prefix: 'scorm/asset-1/v1' }, NOW + 14 * 24 * 3600_000);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('expired_token');
    }

    try {
      await verifyContentToken(first, SECRET, { org: 'o1', prefix: 'scorm/other/v1' }, NOW);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('invalid_token');
    }
  });

  it('survives the year boundary', async () => {
    const input = { org: 'o1', prefix: 'p', anc: [] as string[] };
    const yearEnd = Date.UTC(2026, 11, 28, 12);
    const newYear = Date.UTC(2027, 0, 3, 12);
    const token = await mintContentToken(input, SECRET, yearEnd);

    expect(await verifyContentToken(token, SECRET, { org: 'o1', prefix: 'p' }, newYear)).toBeTruthy();

    try {
      await verifyContentToken(token, SECRET, { org: 'o1', prefix: 'p' }, Date.UTC(2027, 0, 12, 12));
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('expired_token');
    }
  });

  it('rejects foreign token types for content tokens', async () => {
    const launchToken = await mintLaunchToken(
      {
        org: 'o1',
        act: 'a1',
        sub: 'p1',
        unit: 'u1',
        fmt: 'scorm12',
        mode: 'normal',
        anc: []
      },
      SECRET,
      NOW
    );

    try {
      await verifyContentToken(launchToken, SECRET, { org: 'o1', prefix: 'p' }, NOW);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('invalid_token');
    }

    const untyped = await signToken({ org: 'o1', p: 'p', anc: [], wk: isoWeekIndex(new Date(NOW)) }, SECRET);

    try {
      await verifyContentToken(untyped, SECRET, { org: 'o1', prefix: 'p' }, NOW);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('invalid_token');
    }
  });
});
