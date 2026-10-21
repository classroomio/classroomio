import { describe, expect, it } from 'vitest';
import {
  SCORM_ZIP_LIMITS,
  checkZipEntries,
  findCaseInsensitiveMatch,
  findManifestEntry,
  normalizeZipPath,
  zipByteLimit,
  type ZipEntryInfo
} from './index.js';
import { PackageError } from '../errors.js';

function entry(overrides: Partial<ZipEntryInfo> = {}): ZipEntryInfo {
  return {
    name: 'sco.html',
    size: 1000,
    compressedSize: 500,
    isDirectory: false,
    ...overrides
  };
}

describe('normalizeZipPath', () => {
  it('normalizes backslashes and unicode', () => {
    expect(normalizeZipPath('folder\\sco.html')).toBe('folder/sco.html');
    expect(normalizeZipPath('caf\u0065\u0301/sco.html')).toBe('café/sco.html');
  });

  it('rejects absolute, drive and traversal paths', () => {
    for (const bad of ['/etc/sco.html', 'C:/pkg/sco.html', 'C:\\pkg\\sco.html', '../sco.html', 'pkg/../../sco.html']) {
      expect(() => normalizeZipPath(bad)).toThrowError(PackageError);
    }
  });
});

describe('checkZipEntries', () => {
  const limits = { maxEntries: SCORM_ZIP_LIMITS.maxEntries, maxTotalBytes: zipByteLimit(500) * 3, maxRatio: 100 };

  it('accepts a normal listing', () => {
    expect(() => checkZipEntries([entry(), entry({ name: 'style.css' })], limits)).not.toThrow();
  });

  it('rejects too many entries', () => {
    const entries = Array.from({ length: limits.maxEntries + 1 }, (_, index) => entry({ name: `f${index}.html` }));

    try {
      checkZipEntries(entries, limits);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('too_many_entries');
    }
  });

  it('rejects oversized totals', () => {
    try {
      checkZipEntries([entry({ size: limits.maxTotalBytes + 1, compressedSize: limits.maxTotalBytes })], limits);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('total_too_large');
    }
  });

  it('rejects compression bombs', () => {
    try {
      checkZipEntries([entry({ size: 101 * 1024, compressedSize: 1024 })], limits);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('compression_bomb');
    }
  });

  it('rejects symlinks, encrypted entries and unsafe paths', () => {
    for (const [code, bad] of [
      ['symlink_rejected', entry({ isSymlink: true })],
      ['encrypted_entry', entry({ isEncrypted: true })],
      ['unsafe_path', entry({ name: '../evil.html' })]
    ] as const) {
      try {
        checkZipEntries([bad], limits);
        expect.unreachable();
      } catch (error) {
        expect((error as PackageError).code).toBe(code);
      }
    }
  });
});

describe('findManifestEntry', () => {
  it('finds a root manifest', () => {
    expect(findManifestEntry(['imsmanifest.xml', 'sco.html'])).toEqual({
      found: true,
      path: 'imsmanifest.xml',
      prefix: '',
      rebased: false
    });
  });

  it('rebases a single top-level folder', () => {
    expect(findManifestEntry(['pkg/imsmanifest.xml', 'pkg/sco.html'])).toEqual({
      found: true,
      path: 'pkg/imsmanifest.xml',
      prefix: 'pkg/',
      rebased: true
    });
  });

  it('reports format-specific errors without a manifest', () => {
    expect(findManifestEntry(['tincan.xml', 'index.html'])).toEqual({ found: false, error: 'xapi_package' });
    expect(findManifestEntry(['cmi5.xml', 'index.html'])).toEqual({ found: false, error: 'cmi5_package' });
    expect(findManifestEntry(['a/imsmanifest.xml', 'b/imsmanifest.xml'])).toEqual({
      found: false,
      error: 'missing_manifest'
    });
    expect(findManifestEntry(['index.html'])).toEqual({ found: false, error: 'missing_manifest' });
  });
});

describe('findCaseInsensitiveMatch', () => {
  it('prefers exact matches and falls back case-insensitively', () => {
    expect(findCaseInsensitiveMatch('sco.html', ['SCO.HTML', 'sco.html'])).toBe('sco.html');
    expect(findCaseInsensitiveMatch('Images/Logo.PNG', ['images/logo.png'])).toBe('images/logo.png');
    expect(findCaseInsensitiveMatch('missing.html', ['sco.html'])).toBeNull();
  });
});
