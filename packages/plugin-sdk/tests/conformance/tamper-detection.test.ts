import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createDeterministicTarGz } from '../../bin/cio-plugin.mjs';

describe('Conformance: Artifact Tampering Detection', () => {
  const fileA = { path: 'dist/index.html', content: Buffer.from('<!DOCTYPE html><html><body>Test</body></html>') };
  const fileB = { path: 'plugin.json', content: Buffer.from(JSON.stringify({ id: 'com.example.tamper' })) };

  it('detects single-bit tampering in archive contents', () => {
    const originalArchive = createDeterministicTarGz([fileA, fileB]);
    const originalDigest = crypto.createHash('sha256').update(originalArchive).digest('hex');

    // Tamper single byte in file content
    const tamperedFileA = {
      path: 'dist/index.html',
      content: Buffer.from('<!DOCTYPE html><html><body>Test!</body></html>')
    };
    const tamperedArchive = createDeterministicTarGz([tamperedFileA, fileB]);
    const tamperedDigest = crypto.createHash('sha256').update(tamperedArchive).digest('hex');

    expect(tamperedDigest).not.toBe(originalDigest);
  });

  it('detects directory reordering or path manipulation', () => {
    const archive1 = createDeterministicTarGz([fileA, fileB]);
    const digest1 = crypto.createHash('sha256').update(archive1).digest('hex');

    // Changing entry path
    const renamedFileA = { path: 'dist/sub/index.html', content: fileA.content };
    const archive2 = createDeterministicTarGz([renamedFileA, fileB]);
    const digest2 = crypto.createHash('sha256').update(archive2).digest('hex');

    expect(digest1).not.toBe(digest2);
  });
});
