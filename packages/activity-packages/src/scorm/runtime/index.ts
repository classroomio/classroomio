import { PackageError } from '../../errors.js';
import type { ScormPackageFormat, ScormPackageUnit } from '../manifest/index.js';

export type ScormCmi = Record<string, unknown>;
export type ScormCompletionValue = 'completed' | 'incomplete' | 'not_attempted' | 'unknown';
export type ScormSuccessValue = 'passed' | 'failed' | 'unknown';
export type ScormCompletionRule = 'auto' | 'completed' | 'passed' | 'score';
export type ScormTryStatus = 'active' | 'suspended' | 'closed';

export interface ScormModuleOutcome {
  completion: ScormCompletionValue;
  success: ScormSuccessValue;
  hasPassMark: boolean;
  scaledScore: number | null;
}

export interface ScormRuleSettings {
  rule: ScormCompletionRule;
  minScorePercent?: number | null;
}

export interface ScormCommit {
  seq: number;
  cmi: ScormCmi;
  terminate: boolean;
  beacon?: boolean;
}

export const MAX_COMMIT_JSON_BYTES = 131072;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPath(cmi: ScormCmi, path: string): unknown {
  let current: unknown = cmi;

  for (const segment of path.split('.')) {
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      current = current[Number(segment)];
    } else if (isPlainObject(current)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let current: Record<string, unknown> | unknown[] = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextIsIndex = /^\d+$/.test(segments[index + 1]);

    if (Array.isArray(current)) {
      const position = Number(segment);
      if (!isPlainObject(current[position]) && !Array.isArray(current[position])) {
        current[position] = nextIsIndex ? [] : {};
      }
      current = current[position] as Record<string, unknown> | unknown[];
    } else {
      if (!isPlainObject(current[segment]) && !Array.isArray(current[segment])) {
        current[segment] = nextIsIndex ? [] : {};
      }
      current = current[segment] as Record<string, unknown> | unknown[];
    }
  }

  const last = segments[segments.length - 1];

  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else {
    current[last] = value;
  }
}

/**
 * Accepts CMI as nested objects or flat dotted keys (either rooted at `cmi`
 * or not) and returns the canonical nested form the server stores.
 */
export function normalizeCmiShape(raw: unknown): ScormCmi {
  const normalized = normalizeValue(raw);

  return isPlainObject(normalized) ? (normalized as ScormCmi) : {};
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const out: ScormCmi = {};

  for (const [key, entry] of Object.entries(value)) {
    if (key.includes('.')) {
      setPath(out, key, normalizeValue(entry));
    } else {
      out[key] = normalizeValue(entry);
    }
  }

  if (Object.keys(out).length === 1 && isPlainObject(out['cmi'])) {
    return out['cmi'] as ScormCmi;
  }

  return out;
}

/**
 * Flattens stored CMI to dotted keys for players that load state with
 * `loadFromJSON` before launch.
 */
export function flattenCmi(cmi: ScormCmi): Record<string, string> {
  const flat: Record<string, string> = {};

  const visit = (value: unknown, prefix: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, prefix ? `${prefix}.${index}` : `${index}`));
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, entry] of Object.entries(value)) {
        visit(entry, prefix ? `${prefix}.${key}` : key);
      }
      return;
    }

    if (value === null || value === undefined) {
      return;
    }

    flat[prefix] = String(value);
  };

  visit(cmi, '');

  return flat;
}

function mergeValues(stored: unknown, incoming: unknown): unknown {
  if (Array.isArray(incoming) && Array.isArray(stored)) {
    const merged = [...stored];

    for (let index = 0; index < incoming.length; index += 1) {
      merged[index] = index < merged.length ? mergeValues(merged[index], incoming[index]) : incoming[index];
    }

    return merged;
  }

  if (isPlainObject(incoming) && isPlainObject(stored)) {
    const merged: ScormCmi = { ...stored };

    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = key in merged ? mergeValues(merged[key], value) : value;
    }

    return merged;
  }

  return incoming;
}

/**
 * Merges one numbered commit over the stored CMI. Only present fields are
 * overwritten; suspend data and everything else stored whole is kept.
 */
export function mergeCmi(stored: ScormCmi, commit: ScormCmi): ScormCmi {
  return mergeValues(stored, commit) as ScormCmi;
}

/**
 * Validates a run-time commit envelope and normalizes its CMI. Throws
 * `invalid_commit` on a bad shape or an oversized payload.
 */
export function normalizeCommitCmi(commit: unknown): ScormCommit {
  if (!isPlainObject(commit)) {
    throw new PackageError('invalid_commit', { reason: 'not_an_object' });
  }

  const rawSeq = commit['commitSequence'] ?? commit['seq'];
  const seq =
    typeof rawSeq === 'number' ? rawSeq : typeof rawSeq === 'string' && /^\d+$/.test(rawSeq) ? Number(rawSeq) : NaN;

  if (!Number.isInteger(seq) || seq < 0) {
    throw new PackageError('invalid_commit', { reason: 'bad_seq' });
  }

  if (!isPlainObject(commit['cmi'])) {
    throw new PackageError('invalid_commit', { reason: 'bad_cmi' });
  }

  const terminate = commit['terminate'];
  const beacon = commit['beacon'];

  if (terminate !== undefined && typeof terminate !== 'boolean') {
    throw new PackageError('invalid_commit', { reason: 'bad_terminate' });
  }

  if (beacon !== undefined && typeof beacon !== 'boolean') {
    throw new PackageError('invalid_commit', { reason: 'bad_beacon' });
  }

  const normalized: ScormCommit = {
    seq,
    cmi: normalizeCmiShape(commit['cmi']),
    terminate: terminate === true,
    ...(beacon === true ? { beacon: true as const } : {})
  };

  if (JSON.stringify(normalized).length > MAX_COMMIT_JSON_BYTES) {
    throw new PackageError('invalid_commit', { reason: 'too_large', maxBytes: MAX_COMMIT_JSON_BYTES });
  }

  return normalized;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Maps a SCORM 1.2 lesson_status to completion and success values.
 */
export function mapScorm12Outcome(lessonStatus: unknown): {
  completion: ScormCompletionValue;
  success: ScormSuccessValue;
} {
  const status = String(lessonStatus ?? '').toLowerCase();

  switch (status) {
    case 'passed':
      return { completion: 'completed', success: 'passed' };
    case 'completed':
      return { completion: 'completed', success: 'unknown' };
    case 'failed':
      return { completion: 'completed', success: 'failed' };
    case 'incomplete':
      return { completion: 'incomplete', success: 'unknown' };
    case 'browsed':
      return { completion: 'incomplete', success: 'unknown' };
    case 'not attempted':
    case '':
      return { completion: 'not_attempted', success: 'unknown' };
    default:
      return { completion: 'unknown', success: 'unknown' };
  }
}

/**
 * Maps SCORM 2004 completion and success status to shared outcome values.
 */
export function mapScorm2004Outcome(
  completionStatus: unknown,
  successStatus: unknown
): { completion: ScormCompletionValue; success: ScormSuccessValue } {
  const completionRaw = String(completionStatus ?? '').toLowerCase();
  const successRaw = String(successStatus ?? '').toLowerCase();

  const completion: ScormCompletionValue =
    completionRaw === 'completed'
      ? 'completed'
      : completionRaw === 'incomplete'
        ? 'incomplete'
        : completionRaw === 'not attempted' || completionRaw === ''
          ? 'not_attempted'
          : 'unknown';

  const success: ScormSuccessValue =
    successRaw === 'passed' ? 'passed' : successRaw === 'failed' ? 'failed' : 'unknown';

  return { completion, success };
}

function scaledScore12(cmi: ScormCmi): number | null {
  const raw = asNumber(getPath(cmi, 'core.score.raw'));

  if (raw === null) {
    return null;
  }

  const min = asNumber(getPath(cmi, 'core.score.min'));
  const max = asNumber(getPath(cmi, 'core.score.max'));

  if (min !== null && max !== null && max > min) {
    return (raw - min) / (max - min);
  }

  return raw / 100;
}

/**
 * Derives one module's outcome from stored CMI plus its unit's pass marks.
 */
export function moduleOutcomeFromCmi(
  cmi: ScormCmi,
  format: ScormPackageFormat,
  unit: Pick<ScormPackageUnit, 'masteryScore' | 'formatDetails'>
): ScormModuleOutcome {
  if (format === 'scorm12') {
    const mapped = mapScorm12Outcome(getPath(cmi, 'core.lesson_status'));

    return {
      ...mapped,
      hasPassMark: unit.masteryScore !== null && unit.masteryScore !== undefined,
      scaledScore: scaledScore12(cmi)
    };
  }

  const mapped = mapScorm2004Outcome(getPath(cmi, 'completion_status'), getPath(cmi, 'success_status'));

  return {
    ...mapped,
    hasPassMark: unit.formatDetails.scaledPassingScore !== null && unit.formatDetails.scaledPassingScore !== undefined,
    scaledScore: asNumber(getPath(cmi, 'score.scaled'))
  };
}

/**
 * Applies the LMS-side rules before the CMI is stored. The player runs with
 * scorm-again's own completion and mastery flags off, so each rule runs once,
 * here. The 2004 threshold evaluations run on Terminate only.
 */
export function applyLmsRules(
  cmi: ScormCmi,
  unit: Pick<ScormPackageUnit, 'masteryScore' | 'formatDetails'>,
  format: ScormPackageFormat,
  options: { terminated: boolean }
): ScormCmi {
  const next: ScormCmi = JSON.parse(JSON.stringify(cmi)) as ScormCmi;

  if (format === 'scorm12') {
    if (options.terminated) {
      const status = textOfStatus(getPath(next, 'core.lesson_status'));
      const exit = textOfStatus(getPath(next, 'core.exit'));

      if ((status === '' || status === 'not attempted') && exit !== 'suspend') {
        setPath(next, 'core.lesson_status', 'completed');
      }
    }

    if (unit.masteryScore !== null && unit.masteryScore !== undefined) {
      const credit = getPath(next, 'core.credit');
      const creditAllows = credit === null || credit === undefined || String(credit).toLowerCase() === 'credit';
      const raw = asNumber(getPath(next, 'core.score.raw'));

      if (creditAllows && raw !== null) {
        setPath(next, 'core.lesson_status', raw >= unit.masteryScore ? 'passed' : 'failed');
      }
    }

    return next;
  }

  if (options.terminated) {
    const threshold = unit.formatDetails.completionThreshold;
    const progressMeasure = asNumber(getPath(next, 'progress_measure'));

    if (threshold !== null && threshold !== undefined && progressMeasure !== null) {
      setPath(next, 'completion_status', progressMeasure >= threshold ? 'completed' : 'incomplete');
    }

    const passingScore = unit.formatDetails.scaledPassingScore;
    const scaled = asNumber(getPath(next, 'score.scaled'));

    if (passingScore !== null && passingScore !== undefined && scaled !== null) {
      setPath(next, 'success_status', scaled >= passingScore ? 'passed' : 'failed');
    }

    const completion = textOfStatus(getPath(next, 'completion_status'));
    const exit = textOfStatus(getPath(next, 'exit'));

    if ((completion === '' || completion === 'unknown') && exit !== 'suspend') {
      setPath(next, 'completion_status', 'completed');
    }
  }

  return next;
}

function textOfStatus(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

/**
 * Maps a terminate exit to the module try's next status, per SCORM version.
 * SCORM 1.2 resumes an unfinished module whatever exit it sent.
 */
export function statusAfterTerminate(cmi: ScormCmi, format: ScormPackageFormat): ScormTryStatus {
  const exitRaw = format === 'scorm12' ? getPath(cmi, 'core.exit') : getPath(cmi, 'exit');
  const exit = textOfStatus(exitRaw);

  if (exit === 'suspend') {
    return 'suspended';
  }

  if (format !== 'scorm12') {
    return 'closed';
  }

  const { completion } = mapScorm12Outcome(getPath(cmi, 'core.lesson_status'));

  return completion === 'completed' ? 'closed' : 'suspended';
}

/**
 * Averages the scaled scores of the modules that report one. Returns null
 * when no module reports a score.
 */
export function averageScaledScore(modules: ScormModuleOutcome[]): number | null {
  const scores = modules.flatMap((module) => (module.scaledScore === null ? [] : [module.scaledScore]));

  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function isModuleRuleMet(rule: Exclude<ScormCompletionRule, 'score'>, module: ScormModuleOutcome): boolean {
  if (rule === 'completed') {
    return module.completion === 'completed';
  }

  if (rule === 'passed') {
    return module.success === 'passed';
  }

  const isGraded = module.hasPassMark || module.success !== 'unknown';

  if (isGraded) {
    return module.success === 'passed';
  }

  return module.completion === 'completed';
}

/**
 * Returns whether an attempt meets the item's completion rule, given the
 * latest outcome of each launchable module.
 */
export function isScormRuleMet(settings: ScormRuleSettings, modules: ScormModuleOutcome[]): boolean {
  if (modules.length === 0) {
    return false;
  }

  const { rule } = settings;

  if (rule === 'score') {
    const attemptScore = averageScaledScore(modules);
    const everyModuleCompleted = modules.every((module) => module.completion === 'completed');

    return everyModuleCompleted && attemptScore !== null && attemptScore * 100 >= (settings.minScorePercent ?? 100);
  }

  return modules.every((module) => isModuleRuleMet(rule, module));
}
