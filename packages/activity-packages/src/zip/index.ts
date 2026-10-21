import { PackageError } from '../errors.js';

export interface ZipEntryInfo {
  name: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  isSymlink?: boolean;
  isEncrypted?: boolean;
}

export interface ZipCheckLimits {
  maxEntries: number;
  maxTotalBytes: number;
  maxRatio: number;
}

export const SCORM_ZIP_LIMITS = {
  maxEntries: 10000,
  maxRatio: 100
} as const;

export function zipByteLimit(zipLimitMb: number): number {
  return zipLimitMb * 1024 * 1024;
}

/**
 * Normalizes a ZIP entry path for prefix checks. Throws on absolute paths,
 * drive paths and parent-directory traversal.
 */
export function normalizeZipPath(path: string): string {
  const forward = path.replace(/\\/g, '/');
  const normalized = forward.normalize('NFC');

  if (normalized.startsWith('/')) {
    throw new PackageError('unsafe_path', { path });
  }

  if (/^[a-zA-Z]:(\/|$)/.test(normalized)) {
    throw new PackageError('unsafe_path', { path });
  }

  const segments = normalized.split('/').filter((segment) => segment !== '' && segment !== '.');

  if (segments.some((segment) => segment === '..')) {
    throw new PackageError('unsafe_path', { path });
  }

  return segments.join('/');
}

export type ManifestLookup =
  | { found: true; path: string; prefix: string; rebased: boolean }
  | { found: false; error: 'missing_manifest' | 'xapi_package' | 'cmi5_package' };

/**
 * Locates imsmanifest.xml at the archive root or inside one top-level folder.
 * Reports xAPI/cmi5 packages with their own error when no manifest exists.
 */
export function findManifestEntry(names: string[]): ManifestLookup {
  if (names.includes('imsmanifest.xml')) {
    return { found: true, path: 'imsmanifest.xml', prefix: '', rebased: false };
  }

  const nested = names.filter((name) => /^[^/]+\/imsmanifest\.xml$/.test(name));
  const folders = new Set(nested.map((name) => name.slice(0, name.indexOf('/'))));

  if (folders.size === 1) {
    const folder = [...folders][0];
    return { found: true, path: `${folder}/imsmanifest.xml`, prefix: `${folder}/`, rebased: true };
  }

  const hasFile = (target: string) =>
    names.some((name) => name === target || (/^[^/]+\/[^/]+$/.test(name) && name.endsWith(`/${target}`)));

  if (hasFile('tincan.xml')) {
    return { found: false, error: 'xapi_package' };
  }

  if (hasFile('cmi5.xml')) {
    return { found: false, error: 'cmi5_package' };
  }

  return { found: false, error: 'missing_manifest' };
}

/**
 * Applies entry-count, total-size, compression-ratio and path checks to a
 * ZIP listing. Throws the first violation found.
 */
export function checkZipEntries(entries: ZipEntryInfo[], limits: ZipCheckLimits): void {
  if (entries.length > limits.maxEntries) {
    throw new PackageError('too_many_entries', { count: entries.length, max: limits.maxEntries });
  }

  let totalBytes = 0;

  for (const entry of entries) {
    if (entry.isSymlink) {
      throw new PackageError('symlink_rejected', { name: entry.name });
    }

    if (entry.isEncrypted) {
      throw new PackageError('encrypted_entry', { name: entry.name });
    }

    if (entry.isDirectory) {
      normalizeZipPath(entry.name);
      continue;
    }

    normalizeZipPath(entry.name);
    totalBytes += entry.size;

    if (entry.compressedSize > 0 && entry.size / entry.compressedSize > limits.maxRatio) {
      throw new PackageError('compression_bomb', { name: entry.name, ratio: limits.maxRatio });
    }
  }

  if (totalBytes > limits.maxTotalBytes) {
    throw new PackageError('total_too_large', { totalBytes, max: limits.maxTotalBytes });
  }
}

/**
 * Resolves a launch href against already-normalized entry names, accepting an
 * exact match first and a case-insensitive match as a fallback.
 */
export function findCaseInsensitiveMatch(target: string, names: string[]): string | null {
  if (names.includes(target)) {
    return target;
  }

  const lowered = target.toLowerCase();
  const match = names.find((name) => name.toLowerCase() === lowered);

  return match ?? null;
}
