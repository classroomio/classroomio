import type { TScormCompletionRule } from '@cio/utils/validation/activity/scorm';
import type { PackageFingerprint } from './types';

export type ScormVersionLabel = 'scorm12' | 'scorm2004' | 'unknown';

const VERSION_LABELS: Record<string, string> = {
  scorm12: 'SCORM 1.2',
  scorm2004: 'SCORM 2004',
  scorm2004_2: 'SCORM 2004 · 2nd edition',
  scorm2004_3: 'SCORM 2004 · 3rd edition',
  scorm2004_4: 'SCORM 2004 · 4th edition'
};

export function formatScormVersion(format: string | null | undefined): string {
  if (format && format in VERSION_LABELS) return VERSION_LABELS[format];
  if (typeof format === 'string' && format.startsWith('scorm2004')) return VERSION_LABELS.scorm2004;

  return 'SCORM';
}

/**
 * Formats a byte count with binary units.
 */
export function formatPackageBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

  return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${units[index]}`;
}

const RULE_LABELS: Record<TScormCompletionRule, string> = {
  auto: 'Automatic',
  completed: 'Completed',
  passed: 'Passed',
  score: 'Minimum score'
};

/**
 * Short label for a completion rule value.
 */
export function completionRuleLabel(rule: string | null | undefined): string {
  if (rule === 'auto' || rule === 'completed' || rule === 'passed' || rule === 'score') {
    return RULE_LABELS[rule];
  }

  return RULE_LABELS.auto;
}

/**
 * Translation key for a package processing error code. Unknown codes fall
 * back to the generic failure copy.
 */
export function packageErrorKey(code: string | null | undefined): string {
  const known = new Set([
    'missing_manifest',
    'xapi_package',
    'cmi5_package',
    'unsupported_version',
    'invalid_xml',
    'doctype_rejected',
    'missing_launch',
    'external_launch',
    'assets_only',
    'not_a_zip',
    'file_too_large',
    'total_too_large',
    'too_many_entries',
    'compression_bomb',
    'unsafe_path',
    'symlink_rejected',
    'encrypted_entry',
    'upload_missing'
  ]);

  if (code && known.has(code)) return `course.navItem.lessons.activities.package.errors.${code}`;

  return 'course.navItem.lessons.activities.package.errors.generic';
}

/**
 * Formats seconds of learner time as a compact duration.
 */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—';
  }

  const seconds = Math.round(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;

  if (minutes > 0) return `${minutes}m ${String(rest).padStart(2, '0')}s`;

  return `${rest}s`;
}

/**
 * Formats a score percent, with an em-dash for unscored learners.
 */
export function formatScorePercent(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '—';

  return `${score}%`;
}

const TIME_LIMIT_PATTERN = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
const SCORM12_TIME_LIMIT_PATTERN = /^(\d{2,4}):(\d{2}):(\d{2})(?:\.\d{1,2})?$/;

/**
 * Renders a manifest time limit (ISO-8601 duration or SCORM 1.2 HH:MM:SS) as
 * a compact duration. Returns null when the value is missing or malformed.
 */
export function formatTimeLimit(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  const scorm12Match = SCORM12_TIME_LIMIT_PATTERN.exec(trimmed);
  if (scorm12Match) {
    const hours = Number(scorm12Match[1]);
    const minutes = Number(scorm12Match[2]);
    const seconds = Math.floor(Number(scorm12Match[3]));
    if (minutes > 59 || seconds > 59) return null;
    if (hours === 0 && minutes === 0 && seconds === 0) return null;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  const match = TIME_LIMIT_PATTERN.exec(trimmed);
  if (!match || match.slice(1).every((part) => part === undefined)) return null;

  const total =
    Number(match[1] ?? 0) * 365 * 86400 +
    Number(match[2] ?? 0) * 30 * 86400 +
    Number(match[3] ?? 0) * 86400 +
    Number(match[4] ?? 0) * 3600 +
    Number(match[5] ?? 0) * 60 +
    Number(match[6] ?? 0);

  if (!Number.isFinite(total) || total <= 0) return null;

  const parts: string[] = [];
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Shortens a stored user agent to "Browser on OS" for support timelines.
 * Returns null when there is nothing recognizable to show.
 */
export function describeUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;

  const os =
    /iPhone|iPad|iPod/.test(userAgent) && /Mobile/.test(userAgent)
      ? 'iPhone'
      : /iPad/.test(userAgent)
        ? 'iPad'
        : /Android/.test(userAgent)
          ? 'Android'
          : /Windows NT/.test(userAgent)
            ? 'Windows'
            : /Mac OS X/.test(userAgent)
              ? 'macOS'
              : /Linux/.test(userAgent)
                ? 'Linux'
                : /CrOS/.test(userAgent)
                  ? 'ChromeOS'
                  : null;

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\/|Opera/.test(userAgent)
      ? 'Opera'
      : /Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)
        ? 'Chrome'
        : /CriOS\//.test(userAgent)
          ? 'Chrome'
          : /FxiOS\//.test(userAgent)
            ? 'Firefox'
            : /Firefox\//.test(userAgent)
              ? 'Firefox'
              : /Version\//.test(userAgent) && /Safari\//.test(userAgent)
                ? 'Safari'
                : null;

  if (!browser && !os) return null;

  return `${browser ?? 'Browser'} on ${os ?? 'unknown device'}`;
}
export interface ScormManifestSignature {
  ok: boolean;
  manifestIdentifier: string | null;
  title: string | null;
  itemIds: string[];
}

export type PackageIdentityVerdict = 'same_course' | 'different_course' | 'unknown';

const GENERIC_ITEM_ID = /^(?:i|item|r|res|resource|sco|module|lesson|page)?[-_ ]?\d+$/i;

/**
 * Reads the identity of a local package file without unpacking it: the
 * manifest identifier, the organization title and the identifiers of items
 * that launch content.
 * Returns ok: false for anything unreadable.
 */
export async function readScormManifestSignature(file: File): Promise<ScormManifestSignature> {
  const failed: ScormManifestSignature = { ok: false, manifestIdentifier: null, title: null, itemIds: [] };

  try {
    const xml = await extractManifestXml(file);
    if (!xml) return failed;

    const itemIds = Array.from(xml.matchAll(/<item\b([^>]*)>/g))
      .map((match) => match[1])
      .filter((attributes) => /\bidentifierref\s*=/.test(attributes))
      .map((attributes) => attributes.match(/\bidentifier\s*=\s*["']([^"']+)["']/)?.[1])
      .filter((identifier): identifier is string => Boolean(identifier));
    const manifestIdentifier = xml.match(/<manifest\b[^>]*\bidentifier\s*=\s*["']([^"']+)["']/)?.[1] ?? null;

    return {
      ok: itemIds.length > 0,
      manifestIdentifier,
      title: parseManifestTitle(xml),
      itemIds: Array.from(new Set(itemIds)).sort()
    };
  } catch {
    return failed;
  }
}

/**
 * Returns the hex SHA-256 of a file.
 */
export async function sha256OfFile(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the file's SHA-256 when its size matches the current version, the
 * only case where it can be identical. Other files return null without being
 * read, so large uploads cost nothing.
 */
export async function sha256IfSameSize(file: Blob, current: PackageFingerprint): Promise<string | null> {
  if (!current.contentSha256 || current.zipBytes === null || file.size !== current.zipBytes) return null;

  return sha256OfFile(file);
}

function isGenericItemIdSet(ids: string[]): boolean {
  return ids.length === 0 || ids.every((id) => GENERIC_ITEM_ID.test(id));
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Best-effort guess whether a package is the same course as the current
 * version. Authoring tools reuse generic item ids (Rise writes i1/r1 for every
 * course) and may change the manifest identifier on every publish, so callers
 * must treat the verdict as a warning, never a block.
 */
export function comparePackageIdentity(
  next: ScormManifestSignature,
  current: PackageFingerprint
): PackageIdentityVerdict {
  if (!next.ok) return 'unknown';

  if (next.manifestIdentifier && next.manifestIdentifier === current.manifestIdentifier) return 'same_course';

  if (!isGenericItemIdSet(next.itemIds) && !isGenericItemIdSet(current.itemIds)) {
    const overlaps = next.itemIds.some((id) => current.itemIds.includes(id));

    return overlaps ? 'same_course' : 'different_course';
  }

  if (next.title && current.title) {
    return normalizeTitle(next.title) === normalizeTitle(current.title) ? 'same_course' : 'different_course';
  }

  return 'unknown';
}

function parseManifestTitle(xml: string): string | null {
  const defaultId = xml.match(/<organizations\b[^>]*\bdefault\s*=\s*["']([^"']+)["']/)?.[1];
  const organizations = Array.from(xml.matchAll(/<organization\b([^>]*)>([\s\S]*?)<\/organization>/g));
  const chosen =
    organizations.find(
      (match) => defaultId && new RegExp(`\\bidentifier\\s*=\\s*["']${escapeRegExp(defaultId)}["']`).test(match[1])
    ) ?? organizations[0];
  const raw = (chosen?.[2].match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').replace(/<[^>]*>/g, '').trim();

  return raw ? decodeManifestEntities(raw) : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeManifestEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

async function extractManifestXml(file: File): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null;

  const entry = await findManifestEntry(file);
  if (!entry) return null;

  const data = await file.slice(entry.dataOffset, entry.dataOffset + entry.compSize).arrayBuffer();
  const raw =
    entry.method === 0
      ? new Uint8Array(data)
      : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')))
          .arrayBuffer()
          .then((buffer) => new Uint8Array(buffer));

  return new TextDecoder().decode(raw);
}

interface ZipEntryRef {
  method: number;
  compSize: number;
  dataOffset: number;
}

async function findManifestEntry(file: File): Promise<ZipEntryRef | null> {
  const tailSize = Math.min(file.size, 65557 + 22);
  const tail = new DataView(await file.slice(file.size - tailSize, file.size).arrayBuffer());
  let centralOffset = -1;
  let centralCount = 0;

  for (let position = tail.byteLength - 22; position >= 0; position -= 1) {
    if (tail.getUint32(position, true) !== 0x06054b50) continue;

    if (tail.getUint16(position + 10, true) !== tail.getUint16(position + 8, true)) return null;
    centralCount = tail.getUint16(position + 10, true);
    centralOffset = tail.getUint32(position + 16, true);
    break;
  }

  if (centralOffset < 0 || centralOffset >= file.size) return null;

  const view = new DataView(await file.slice(centralOffset, file.size).arrayBuffer());
  let position = 0;

  for (let index = 0; index < centralCount; index += 1) {
    if (position + 46 > view.byteLength || view.getUint32(position, true) !== 0x02014b50) return null;

    const method = view.getUint16(position + 10, true);
    const compSize = view.getUint32(position + 20, true);
    const nameLength = view.getUint16(position + 28, true);
    const extraLength = view.getUint16(position + 30, true);
    const commentLength = view.getUint16(position + 32, true);
    const localOffset = view.getUint32(position + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + position + 46, nameLength));
    position += 46 + nameLength + extraLength + commentLength;

    if (!isManifestPath(name)) continue;
    if (method !== 0 && method !== 8) return null;
    if (compSize === 0xffffffff || localOffset === 0xffffffff) return null;

    const local = new DataView(await file.slice(localOffset, localOffset + 30).arrayBuffer());
    if (local.byteLength < 30 || local.getUint32(0, true) !== 0x04034b50) return null;

    const dataOffset = localOffset + 30 + local.getUint16(26, true) + local.getUint16(28, true);

    return { method, compSize, dataOffset };
  }

  return null;
}

function isManifestPath(name: string): boolean {
  if (name === 'imsmanifest.xml') return true;

  const segments = name.split('/');

  return segments.length === 2 && segments[1] === 'imsmanifest.xml';
}

export function unitPassMark(unit: { masteryScoreRaw?: unknown; passingScoreScaled?: unknown }): number | null {
  const rawMastery =
    typeof unit.masteryScoreRaw === 'string' || typeof unit.masteryScoreRaw === 'number'
      ? Number(unit.masteryScoreRaw)
      : NaN;
  if (Number.isFinite(rawMastery)) return rawMastery;

  const rawScaled =
    typeof unit.passingScoreScaled === 'string' || typeof unit.passingScoreScaled === 'number'
      ? Number(unit.passingScoreScaled)
      : NaN;
  if (Number.isFinite(rawScaled)) return Math.round(rawScaled * 100);

  return null;
}

export type PlayerInboundMessage =
  | { type: 'ready' }
  | { type: 'terminated'; navRequest: string | null }
  | { type: 'completed' }
  | { type: 'progress' }
  | { type: 'did-not-connect' };

/**
 * Parses a message posted by the activity player. Returns null for anything
 * the player protocol does not define, so stray messages never drive the UI.
 */
export function parsePlayerMessage(data: unknown): PlayerInboundMessage | null {
  if (typeof data !== 'object' || data === null) return null;

  const record = data as Record<string, unknown>;
  if (record['type'] === 'ready') return { type: 'ready' };
  if (record['type'] === 'completed') return { type: 'completed' };
  if (record['type'] === 'progress') return { type: 'progress' };
  if (record['type'] === 'did-not-connect') return { type: 'did-not-connect' };
  if (record['type'] === 'terminated') {
    const navRequest = record['navRequest'];

    return { type: 'terminated', navRequest: typeof navRequest === 'string' && navRequest ? navRequest : null };
  }

  return null;
}

/**
 * Returns the origin (scheme, host and port) of a player URL.
 */
export function contentOriginOf(playerUrl: string): string | null {
  try {
    return new URL(playerUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Accepts player messages only from the content origin the player was
 * launched from. Anything else is a foreign frame and is ignored.
 */
export function isTrustedPlayerMessage(eventOrigin: string, playerUrl: string): boolean {
  const contentOrigin = contentOriginOf(playerUrl);

  return contentOrigin !== null && eventOrigin === contentOrigin;
}
