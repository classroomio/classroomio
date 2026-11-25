import { nanoid } from 'nanoid';
import path from 'path';

/**
 * Safely extracts the file extension from a filename.
 * Returns an empty string if no extension is found.
 */
export function getExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const ext = path.extname(filename).split('.');
  return ext.length > 1 ? ext[ext.length - 1] : '';
}

export function removeSpacesAndSpecialCharacters(fileName: string): string {
  return fileName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();
}

/**
 * Generates a unique file key for storage, preserving the file extension.
 *
 * When `organizationId` is supplied the key is prefixed with it, so ownership
 * of an object can be established from the key alone without a database
 * lookup. Keys minted before that prefix existed have no organization segment;
 * `readOrganizationIdFromFileKey` returns null for those.
 *
 * Throws an error if the filename is invalid or has no extension.
 */
export function generateFileKey(fileName: string, organizationId?: string): string {
  const ext = getExtension(fileName);
  if (!ext) {
    throw new Error('Invalid file name or missing file extension');
  }

  const cleanedFileName = removeSpacesAndSpecialCharacters(fileName);
  const unscopedKey = `${nanoid()}-${cleanedFileName}`;

  return organizationId ? `${organizationId}/${unscopedKey}` : unscopedKey;
}

const ORGANIZATION_PREFIXED_KEY = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[^/]+$/i;

/**
 * Reads the owning organization id out of a storage key, or null when the key
 * predates organization-prefixed keys and ownership cannot be determined from
 * it.
 */
export function readOrganizationIdFromFileKey(fileKey: string): string | null {
  return ORGANIZATION_PREFIXED_KEY.exec(fileKey)?.[1] ?? null;
}

export interface FileKeyOwnershipRecords {
  /** Organization that owns the asset whose id is the key's prefix, when such an asset exists. */
  prefixAssetOrganizationId?: string;
  /** Organizations that registered an asset claiming this exact key. */
  claimingOrganizationIds?: string[];
}

/**
 * Organizations that own the object behind `fileKey`. A prefix that is an asset id belongs to that asset's
 * organization, because asset ids are server-generated and cannot be chosen by a caller. Any other prefix is an
 * organization id. Callers can register any key on their own assets, so those claims only decide keys with no
 * prefix. A key with neither returns an empty list.
 */
export function resolveFileKeyOwnerOrganizationIds(fileKey: string, records: FileKeyOwnershipRecords = {}): string[] {
  const prefix = readOrganizationIdFromFileKey(fileKey);
  if (prefix) return [records.prefixAssetOrganizationId ?? prefix];

  return records.claimingOrganizationIds ?? [];
}
