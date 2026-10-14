import { describe, expect, it } from 'vitest';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

import {
  comparePackageIdentity,
  completionRuleLabel,
  describeUserAgent,
  formatDuration,
  formatPackageBytes,
  formatScorePercent,
  formatScormVersion,
  formatTimeLimit,
  sha256IfSameSize,
  parsePlayerMessage,
  readScormManifestSignature,
  unitPassMark,
  type ScormManifestSignature
} from './scorm-utils';
import type { PackageFingerprint } from './types';

describe('formatScormVersion', () => {
  it('labels known formats', () => {
    expect(formatScormVersion('scorm12')).toBe('SCORM 1.2');
    expect(formatScormVersion('scorm2004')).toBe('SCORM 2004');
    expect(formatScormVersion('scorm2004_4')).toBe('SCORM 2004 · 4th edition');
  });

  it('falls back to SCORM for unknown formats', () => {
    expect(formatScormVersion(null)).toBe('SCORM');
    expect(formatScormVersion('cmi5')).toBe('SCORM');
  });
});

describe('formatPackageBytes', () => {
  it('formats binary units', () => {
    expect(formatPackageBytes(0)).toBe('0 Bytes');
    expect(formatPackageBytes(1536)).toBe('1.5 KB');
    expect(formatPackageBytes(500 * 1024 * 1024)).toBe('500 MB');
  });

  it('renders missing sizes as an em dash', () => {
    expect(formatPackageBytes(null)).toBe('—');
    expect(formatPackageBytes(-1)).toBe('—');
  });
});

describe('completionRuleLabel', () => {
  it('labels every rule and defaults unknown rules to automatic', () => {
    expect(completionRuleLabel('score')).toBe('Minimum score');
    expect(completionRuleLabel('bogus')).toBe('Automatic');
  });
});

describe('unitPassMark', () => {
  it('reads typed mastery and scaled pass marks', () => {
    expect(unitPassMark({ masteryScoreRaw: '80' })).toBe(80);
    expect(unitPassMark({ passingScoreScaled: 0.8 })).toBe(80);
    expect(unitPassMark({ passingScoreScaled: '0.8' })).toBe(80);
  });

  it('returns null without a pass mark', () => {
    expect(unitPassMark({})).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours compactly', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(185)).toBe('3m 05s');
    expect(formatDuration(7260)).toBe('2h 1m');
  });

  it('renders missing time as an em dash', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(-5)).toBe('—');
  });
});

describe('formatScorePercent', () => {
  it('renders percents and dashes for missing scores', () => {
    expect(formatScorePercent(90)).toBe('90%');
    expect(formatScorePercent(null)).toBe('—');
  });
});

const MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course-1">
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>Safety Basics</title>
      <item identifier="mod-1" identifierref="res-1"><title>Module one</title></item>
      <item identifier="mod-2" identifierref="res-2"><title>Module two</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" href="mod1.html" />
    <resource identifier="res-2" href="mod2.html" />
  </resources>
</manifest>`;

function buildZip(entries: Array<{ name: string; data: Uint8Array; method: number }>): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const encoder = new TextEncoder();

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(8, entry.method, true);
    header.setUint32(14, entry.data.length, true);
    header.setUint32(18, entry.data.length, true);
    header.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(header.buffer), name, entry.data);

    const centralHeader = new DataView(new ArrayBuffer(46));
    centralHeader.setUint32(0, 0x02014b50, true);
    centralHeader.setUint16(10, entry.method, true);
    centralHeader.setUint32(20, entry.data.length, true);
    centralHeader.setUint32(24, entry.data.length, true);
    centralHeader.setUint16(28, name.length, true);
    centralHeader.setUint32(42, offset, true);
    central.push(new Uint8Array(centralHeader.buffer), name);
    offset += 30 + name.length + entry.data.length;
  }

  const centralSize = central.reduce((total, chunk) => total + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + 22);
  let position = 0;
  for (const chunk of [...chunks, ...central, new Uint8Array(end.buffer)]) {
    out.set(chunk, position);
    position += chunk.length;
  }

  return out;
}

function zipFile(entries: Array<{ name: string; data: Uint8Array; method: number }>): File {
  return new File([buildZip(entries).buffer as ArrayBuffer], 'package.zip', { type: 'application/zip' });
}

describe('readScormManifestSignature', () => {
  it('reads a stored manifest at the root', async () => {
    const file = zipFile([{ name: 'imsmanifest.xml', data: new TextEncoder().encode(MANIFEST), method: 0 }]);
    const signature = await readScormManifestSignature(file);

    expect(signature).toEqual({
      ok: true,
      manifestIdentifier: 'course-1',
      title: 'Safety Basics',
      itemIds: ['mod-1', 'mod-2']
    });
  });

  it('reads a deflated manifest inside one top-level folder', async () => {
    const file = zipFile([
      { name: 'course/imsmanifest.xml', data: new Uint8Array(deflateRawSync(MANIFEST)), method: 8 }
    ]);
    const signature = await readScormManifestSignature(file);

    expect(signature.ok).toBe(true);
    expect(signature.itemIds).toEqual(['mod-1', 'mod-2']);
  });

  it('fails soft on non-zips and zips without a manifest', async () => {
    const junk = new File(['not a zip'], 'package.zip', { type: 'application/zip' });
    expect((await readScormManifestSignature(junk)).ok).toBe(false);

    const empty = zipFile([{ name: 'readme.txt', data: new TextEncoder().encode('hi'), method: 0 }]);
    expect((await readScormManifestSignature(empty)).ok).toBe(false);
  });
});

const fixturesDir = new URL('../../../../../../../packages/activity-packages/test/fixtures/', import.meta.url);

function fixtureFile(name: string): File {
  return new File([readFileSync(new URL(name, fixturesDir))], name, { type: 'application/zip' });
}

function fingerprintOf(
  file: File,
  signature: ScormManifestSignature,
  contentSha256: string | null
): PackageFingerprint {
  return {
    contentSha256,
    zipBytes: file.size,
    manifestIdentifier: signature.manifestIdentifier,
    title: signature.title,
    itemIds: signature.itemIds
  };
}

describe('readScormManifestSignature on real packages', () => {
  it.each([
    ['vendor-rise-style.zip', 'CIO-VENDOR-RISE-STYLE'],
    ['vendor-storyline-style.zip', 'CIO-VENDOR-STORYLINE-STYLE'],
    ['RuntimeMinimumCalls_SCORM12.zip', null]
  ])('reads %s built by a standard zip tool', async (name, manifestIdentifier) => {
    const signature = await readScormManifestSignature(fixtureFile(name));

    expect(signature.ok).toBe(true);
    if (manifestIdentifier) expect(signature.manifestIdentifier).toBe(manifestIdentifier);
    expect(signature.itemIds.length).toBeGreaterThan(0);
  });

  it('counts the golf sample modules the way processing stores them', async () => {
    const signature = await readScormManifestSignature(fixtureFile('RuntimeMinimumCalls_SCORM12.zip'));

    expect(signature.itemIds).toHaveLength(18);
    expect(signature.itemIds).toContain('playing_quiz_item');
  });
});

describe('sha256IfSameSize', () => {
  it('hashes only a file the size of the current version', async () => {
    const file = fixtureFile('vendor-storyline-style.zip');
    const signature = await readScormManifestSignature(file);
    const sha = createHash('sha256')
      .update(readFileSync(new URL('vendor-storyline-style.zip', fixturesDir)))
      .digest('hex');
    const current = fingerprintOf(file, signature, sha);

    expect(await sha256IfSameSize(file, current)).toBe(sha);
    expect(await sha256IfSameSize(fixtureFile('vendor-rise-style.zip'), current)).toBeNull();

    const sameSizeOtherBytes = new File([new Uint8Array(file.size)], 'other.zip');
    const otherDigest = await sha256IfSameSize(sameSizeOtherBytes, current);
    expect(otherDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(otherDigest).not.toBe(sha);
    expect(await sha256IfSameSize(file, { ...current, contentSha256: null })).toBeNull();
  });
});

describe('comparePackageIdentity', () => {
  const signature = (overrides: Partial<ScormManifestSignature>): ScormManifestSignature => ({
    ok: true,
    manifestIdentifier: null,
    title: null,
    itemIds: [],
    ...overrides
  });
  const fingerprint = (overrides: Partial<PackageFingerprint>): PackageFingerprint => ({
    contentSha256: null,
    zipBytes: null,
    manifestIdentifier: null,
    title: null,
    itemIds: [],
    ...overrides
  });

  it('treats a shared manifest identifier as the same course', () => {
    expect(
      comparePackageIdentity(
        signature({ manifestIdentifier: 'storyline-abc', title: 'Renamed', itemIds: ['x'] }),
        fingerprint({ manifestIdentifier: 'storyline-abc', title: 'Original', itemIds: ['y'] })
      )
    ).toBe('same_course');
  });

  it('compares distinctive item identifiers when the manifest identifier changed', () => {
    const current = fingerprint({ manifestIdentifier: 'old', itemIds: ['safety_intro', 'safety_quiz'] });

    expect(comparePackageIdentity(signature({ manifestIdentifier: 'new', itemIds: ['safety_quiz'] }), current)).toBe(
      'same_course'
    );
    expect(comparePackageIdentity(signature({ manifestIdentifier: 'new', itemIds: ['fire_intro'] }), current)).toBe(
      'different_course'
    );
  });

  it('falls back to the title when every item identifier is generic', () => {
    const current = fingerprint({ manifestIdentifier: 'rise-1', title: 'HIPAA Basics', itemIds: ['i1'] });

    expect(
      comparePackageIdentity(
        signature({ manifestIdentifier: 'rise-2', title: 'HIPAA  basics', itemIds: ['i1'] }),
        current
      )
    ).toBe('same_course');
    expect(
      comparePackageIdentity(
        signature({ manifestIdentifier: 'rise-3', title: 'Fire Safety', itemIds: ['i1'] }),
        current
      )
    ).toBe('different_course');
  });

  it('tells two different real packages that share ITEM-1 apart', async () => {
    const storyline = fixtureFile('vendor-storyline-style.zip');
    const storylineSignature = await readScormManifestSignature(storyline);
    const riseSignature = await readScormManifestSignature(fixtureFile('vendor-rise-style.zip'));

    expect(storylineSignature.itemIds).toEqual(riseSignature.itemIds);
    expect(comparePackageIdentity(riseSignature, fingerprintOf(storyline, storylineSignature, null))).toBe(
      'different_course'
    );
  });

  it('returns unknown when the manifest is unreadable or carries no signal', () => {
    expect(comparePackageIdentity(signature({ ok: false }), fingerprint({ title: 'A' }))).toBe('unknown');
    expect(comparePackageIdentity(signature({ itemIds: ['i1'] }), fingerprint({ itemIds: ['i1'] }))).toBe('unknown');
  });
});

describe('parsePlayerMessage', () => {
  it('parses player lifecycle messages', () => {
    expect(parsePlayerMessage({ type: 'ready' })).toEqual({ type: 'ready' });
    expect(parsePlayerMessage({ type: 'completed' })).toEqual({ type: 'completed' });
    expect(parsePlayerMessage({ type: 'did-not-connect' })).toEqual({ type: 'did-not-connect' });
    expect(parsePlayerMessage({ type: 'terminated', navRequest: 'continue' })).toEqual({
      type: 'terminated',
      navRequest: 'continue'
    });
  });

  it('rejects unknown messages', () => {
    expect(parsePlayerMessage(null)).toBeNull();
    expect(parsePlayerMessage({ type: 'unknown' })).toBeNull();
  });
});

describe('describeUserAgent', () => {
  it('shortens common user agents to browser and OS', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      )
    ).toBe('Chrome on Windows');
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15'
      )
    ).toBe('Safari on macOS');
    expect(
      describeUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.71 Mobile/15E148 Safari/604.1'
      )
    ).toBe('Chrome on iPhone');
    expect(describeUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0')).toBe(
      'Firefox on Linux'
    );
  });

  it('returns null for missing or unrecognized agents', () => {
    expect(describeUserAgent(null)).toBeNull();
    expect(describeUserAgent(undefined)).toBeNull();
    expect(describeUserAgent('')).toBeNull();
    expect(describeUserAgent('curl/8.0')).toBeNull();
  });
});

describe('formatTimeLimit', () => {
  it('formats SCORM 1.2 HH:MM:SS durations', () => {
    expect(formatTimeLimit('00:45:00')).toBe('45m');
    expect(formatTimeLimit('01:30:00')).toBe('1h 30m');
    expect(formatTimeLimit('00:00:30')).toBe('30s');
    expect(formatTimeLimit('02:15:45')).toBe('2h 15m 45s');
    expect(formatTimeLimit('00:45:00.50')).toBe('45m');
  });

  it('formats SCORM 2004 ISO 8601 durations', () => {
    expect(formatTimeLimit('PT45M')).toBe('45m');
    expect(formatTimeLimit('PT1H30M')).toBe('1h 30m');
    expect(formatTimeLimit('PT30S')).toBe('30s');
    expect(formatTimeLimit('PT1H15M45S')).toBe('1h 15m 45s');
  });

  it('returns null for missing, zero, or malformed time limits', () => {
    expect(formatTimeLimit(null)).toBeNull();
    expect(formatTimeLimit(undefined)).toBeNull();
    expect(formatTimeLimit('')).toBeNull();
    expect(formatTimeLimit('00:00:00')).toBeNull();
    expect(formatTimeLimit('00:99:99')).toBeNull();
    expect(formatTimeLimit('PT0S')).toBeNull();
    expect(formatTimeLimit('invalid')).toBeNull();
  });
});
