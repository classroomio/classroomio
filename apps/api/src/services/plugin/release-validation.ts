import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { AppError } from '@api/utils/errors';
import { ZPluginManifest, type TPluginManifest } from '@cio/utils/validation/plugin';

export interface TarEntry {
  path: string;
  size: number;
  type: string;
  content: Buffer;
}

export const MAX_PLUGIN_ARCHIVE_BYTES = 12 * 1024 * 1024;
const MAX_PLUGIN_EXTRACTED_BYTES = 48 * 1024 * 1024;
const MAX_PLUGIN_ARCHIVE_ENTRIES = 1_000;

export function parseTarGz(archiveBuffer: Buffer): TarEntry[] {
  if (archiveBuffer.length > MAX_PLUGIN_ARCHIVE_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum upload size', 'ARCHIVE_TOO_LARGE', 413);
  }

  let tarBuffer: Buffer;
  try {
    tarBuffer = zlib.gunzipSync(archiveBuffer);
  } catch {
    throw new AppError('Invalid gzip archive: failed to decompress', 'INVALID_ARCHIVE', 400);
  }

  if (tarBuffer.length > MAX_PLUGIN_EXTRACTED_BYTES) {
    throw new AppError('Plugin archive exceeds the maximum extracted size', 'ARCHIVE_TOO_LARGE', 413);
  }

  const entries: TarEntry[] = [];
  let byteOffset = 0;

  while (byteOffset + 512 <= tarBuffer.length) {
    const headerBlock = tarBuffer.subarray(byteOffset, byteOffset + 512);
    const isZeroBlock = headerBlock.every((byteValue) => byteValue === 0);
    if (isZeroBlock) break;

    let relativePath = headerBlock.toString('utf8', 0, 100).replace(/\0.*$/, '');
    const prefix = headerBlock.toString('utf8', 345, 500).replace(/\0.*$/, '');
    if (prefix) {
      relativePath = `${prefix}/${relativePath}`;
    }

    const sizeString = headerBlock.toString('ascii', 124, 136).replace(/\0.*$/, '').trim();
    if (!/^[0-7]+$/.test(sizeString)) {
      throw new AppError('Invalid tar archive entry size', 'INVALID_ARCHIVE', 400);
    }

    const size = parseInt(sizeString, 8);
    const typeFlag = String.fromCharCode(headerBlock[156]);

    byteOffset += 512;
    const content = tarBuffer.subarray(byteOffset, byteOffset + size);
    const paddedBlockCount = Math.ceil(size / 512) * 512;
    byteOffset += paddedBlockCount;

    if (byteOffset > tarBuffer.length) {
      throw new AppError('Invalid tar archive entry size', 'INVALID_ARCHIVE', 400);
    }

    entries.push({
      path: relativePath,
      size,
      type: typeFlag,
      content: Buffer.from(content)
    });

    if (entries.length > MAX_PLUGIN_ARCHIVE_ENTRIES) {
      throw new AppError('Plugin archive contains too many files', 'ARCHIVE_TOO_LARGE', 413);
    }
  }

  return entries;
}

export function validatePluginArchive(
  archiveBuffer: Buffer,
  expectedDigest: string
): { entries: TarEntry[]; manifest: TPluginManifest } {
  const computedDigest = `sha256-${crypto.createHash('sha256').update(archiveBuffer).digest('hex')}`;
  if (computedDigest !== expectedDigest) {
    throw new AppError('Plugin archive digest does not match the submitted digest', 'ARTIFACT_DIGEST_MISMATCH', 400);
  }

  const entries = parseTarGz(archiveBuffer);
  const paths = new Set<string>();
  let manifestEntry: TarEntry | undefined;

  for (const entry of entries) {
    const pathSegments = entry.path.split('/');
    const hasUnsafePath =
      !entry.path ||
      entry.path.startsWith('/') ||
      entry.path.includes('\\') ||
      pathSegments.some((segment) => segment === '..' || segment === '') ||
      paths.has(entry.path);
    if (hasUnsafePath) {
      throw new AppError(`Archive contains an invalid path: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }
    paths.add(entry.path);

    if (entry.type !== '0' && entry.type !== '\0') {
      throw new AppError(`Archive contains a forbidden entry type: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    if (entry.path === 'plugin.json') {
      manifestEntry = entry;
    }

    if (/\.(js|mjs|ts|tsx|svelte|html)$/i.test(entry.path)) {
      const source = entry.content.toString('utf8');
      if (source.includes('@cio/') || source.includes('$lib/') || source.includes('$app/')) {
        throw new AppError(`Archive contains a forbidden host import: ${entry.path}`, 'FORBIDDEN_IMPORT', 400);
      }
    }
  }

  if (!manifestEntry) {
    throw new AppError('Archive is missing plugin.json', 'MISSING_MANIFEST', 400);
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestEntry.content.toString('utf8'));
  } catch {
    throw new AppError('plugin.json is not valid JSON', 'INVALID_MANIFEST', 400);
  }

  const parseResult = ZPluginManifest.safeParse(manifestJson);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new AppError(`Manifest validation failed: ${errorDetails}`, 'INVALID_MANIFEST', 400);
  }

  const manifest = parseResult.data;

  const declaredEntrypoints = manifest.runtime?.ui?.entrypoints ?? {};
  for (const [key, entrypoint] of Object.entries(declaredEntrypoints)) {
    const resource = typeof entrypoint === 'string' ? entrypoint : entrypoint?.resource;
    if (resource) {
      const normalizedResource = resource.startsWith('dist/') ? resource.slice('dist/'.length) : resource;
      const resourceExists = paths.has(resource) || paths.has(normalizedResource);
      if (!resourceExists) {
        throw new AppError(`Archive is missing declared entrypoint "${key}" (${resource})`, 'MISSING_RESOURCE', 400);
      }
    }
  }

  if (manifest.icon?.resource) {
    const iconResource = manifest.icon.resource;
    const normalizedIcon = iconResource.startsWith('dist/') ? iconResource.slice('dist/'.length) : iconResource;
    const iconExists = paths.has(iconResource) || paths.has(normalizedIcon);
    if (!iconExists) {
      throw new AppError(`Archive is missing declared icon (${iconResource})`, 'MISSING_RESOURCE', 400);
    }
  }

  return { entries, manifest };
}

export function extractEntriesToDirectory(
  entries: TarEntry[],
  destinationDirectory: string,
  archiveBuffer?: Buffer
): void {
  const resolvedDestination = path.resolve(destinationDirectory);
  if (resolvedDestination === path.parse(resolvedDestination).root) {
    throw new AppError('Invalid artifact destination', 'SECURITY_VIOLATION', 400);
  }

  fs.rmSync(resolvedDestination, { recursive: true, force: true });
  fs.mkdirSync(resolvedDestination, { recursive: true });

  for (const entry of entries) {
    const filePath = path.resolve(resolvedDestination, entry.path);
    if (!filePath.startsWith(`${resolvedDestination}${path.sep}`)) {
      throw new AppError(`Archive contains an invalid path: ${entry.path}`, 'SECURITY_VIOLATION', 400);
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, entry.content);
  }

  if (archiveBuffer) {
    const archivePath = path.join(resolvedDestination, 'package.tar.gz');
    fs.writeFileSync(archivePath, archiveBuffer);
  }
}
