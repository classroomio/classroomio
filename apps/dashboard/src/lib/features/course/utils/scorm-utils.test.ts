import { describe, expect, it } from 'vitest';

import { deflateRawSync } from 'node:zlib';

import {
  compareManifestSignature,
  completionRuleLabel,
  formatDuration,
  formatPackageBytes,
  formatScorePercent,
  formatScormVersion,
  readScormManifestSignature,
  unitPassMark
} from './scorm-utils';

describe('formatScormVersion', () => {
  it('labels known formats', () => {
    expect(formatScormVersion('scorm12')).toBe('SCORM 1.2');
    expect(formatScormVersion('scorm2004_4')).toBe('SCORM 2004');
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
    centralHeader.setUint16(26, name.length, true);
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

    expect(signature.ok).toBe(true);
    expect(signature.title).toBe('Safety Basics');
    expect(signature.scoIds).toEqual(['mod-1', 'mod-2']);
  });

  it('reads a deflated manifest inside one top-level folder', async () => {
    const file = zipFile([
      { name: 'course/imsmanifest.xml', data: new Uint8Array(deflateRawSync(MANIFEST)), method: 8 }
    ]);
    const signature = await readScormManifestSignature(file);

    expect(signature.ok).toBe(true);
    expect(signature.scoIds).toEqual(['mod-1', 'mod-2']);
  });

  it('fails soft on non-zips and zips without a manifest', async () => {
    const junk = new File(['not a zip'], 'package.zip', { type: 'application/zip' });
    expect((await readScormManifestSignature(junk)).ok).toBe(false);

    const empty = zipFile([{ name: 'readme.txt', data: new TextEncoder().encode('hi'), method: 0 }]);
    expect((await readScormManifestSignature(empty)).ok).toBe(false);
  });
});

describe('compareManifestSignature', () => {
  const current = { title: 'Safety Basics', scoIds: ['mod-1', 'mod-2'], zipBytes: 1024 };

  it('distinguishes same file, same course and different courses', () => {
    expect(
      compareManifestSignature({ ok: true, title: 'Safety Basics', scoIds: ['mod-1', 'mod-2'] }, current, 1024)
    ).toBe('same_file');
    expect(
      compareManifestSignature({ ok: true, title: 'Safety Basics v2', scoIds: ['mod-1', 'mod-2'] }, current, 2048)
    ).toBe('same_course');
    expect(compareManifestSignature({ ok: true, title: 'Firefighting', scoIds: ['fire-1'] }, current, 2048)).toBe(
      'different_course'
    );
    expect(compareManifestSignature({ ok: false, title: null, scoIds: [] }, current, 1024)).toBe('unknown');
  });
});
