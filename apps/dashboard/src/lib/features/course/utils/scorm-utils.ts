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
