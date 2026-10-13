import type { TScormCompletionRule } from '@cio/utils/validation/activity/scorm';

export type ScormVersionLabel = 'scorm12' | 'scorm2004' | 'unknown';

const VERSION_LABELS: Record<Exclude<ScormVersionLabel, 'unknown'>, string> = {
  scorm12: 'SCORM 1.2',
  scorm2004: 'SCORM 2004'
};

/**
 * Human label for a stored package format. Unknown formats stay unknown so
 * the editor never invents a version.
 */
export function formatScormVersion(format: string | null | undefined): string {
  if (format === 'scorm12' || format === 'scorm2004') return VERSION_LABELS[format];
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
export interface ScormManifestSignature {
  ok: boolean;
  title: string | null;
  scoIds: string[];
}

/**
 * Reads the manifest identity of a local package file without unpacking
 * it: the module identifier set and the organization title. Returns
 * ok: false for anything unreadable; callers skip validation then.
 */
export async function readScormManifestSignature(file: File): Promise<ScormManifestSignature> {
  const failed: ScormManifestSignature = { ok: false, title: null, scoIds: [] };

  try {
    const xml = await extractManifestXml(file);
    if (!xml) return failed;

    const scoIds = Array.from(xml.matchAll(/<item\b[^>]*\bidentifier="([^"]+)"/g)).map((match) => match[1]);
    const title = parseManifestTitle(xml);

    return { ok: scoIds.length > 0, title, scoIds: Array.from(new Set(scoIds)).sort() };
  } catch {
    return failed;
  }
}

/**
 * Compares a freshly read manifest against the current version for the
 * upgrade flow: same file (block), same course (proceed), or a disjoint
 * module set (warn that it looks like a different course).
 */
export function compareManifestSignature(
  next: ScormManifestSignature,
  current: { title: string | null; scoIds: string[]; zipBytes: number | null },
  nextBytes: number
): 'same_file' | 'same_course' | 'different_course' | 'unknown' {
  if (!next.ok) return 'unknown';

  const sameIds =
    next.scoIds.length === current.scoIds.length && next.scoIds.every((id) => current.scoIds.includes(id));
  if (sameIds && next.title === current.title && current.zipBytes !== null && nextBytes === current.zipBytes) {
    return 'same_file';
  }
  if (sameIds) return 'same_course';

  const overlap = next.scoIds.some((id) => current.scoIds.includes(id));

  return overlap ? 'same_course' : 'different_course';
}

function parseManifestTitle(xml: string): string | null {
  const organization = xml.match(/<organization\b[\s\S]*?<title>([\s\S]*?)<\/title>/);
  const raw = (organization?.[1] ?? '').replace(/<[^>]*>/g, '').trim();

  return raw ? decodeManifestEntities(raw) : null;
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
    const nameLength = view.getUint16(position + 26, true);
    const extraLength = view.getUint16(position + 28, true);
    const commentLength = view.getUint16(position + 30, true);
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
  | { type: 'did-not-connect' };

/**
 * Parses a message posted by the activity player. Returns null for anything
 * the player protocol does not define, so stray messages never drive the UI.
 */
export function parsePlayerMessage(data: unknown): PlayerInboundMessage | null {
  if (typeof data !== 'object' || data === null) return null;

  const record = data as Record<string, unknown>;
  if (record['type'] === 'ready') return { type: 'ready' };
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
