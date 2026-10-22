import { PackageError } from '../../errors.js';
import type { ScormPackageFormat, ScormPackageUnit } from '../manifest/index.js';

export type ScormCmi = Record<string, unknown>;
export type ScormCompletionValue = 'completed' | 'incomplete' | 'not_attempted' | 'unknown';
export type ScormSuccessValue = 'passed' | 'failed' | 'unknown';
export type ScormCompletionRule = 'auto' | 'completed' | 'passed' | 'score';
export type ScormCompletionModules = 'all' | 'graded_only';
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
  completionModules?: ScormCompletionModules;
}

export interface ScormCommit {
  seq: number;
  cmi: ScormCmi;
  terminate: boolean;
  beacon?: boolean;
}

export const MAX_COMMIT_JSON_BYTES = 524288;
const MAX_CMI_INDEX = 1000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnsafeSegment(segment: string): boolean {
  return segment === '__proto__' || segment === 'constructor' || segment === 'prototype';
}

function getPath(cmi: ScormCmi, path: string): unknown {
  let current: unknown = cmi;

  for (const segment of path.split('.')) {
    if (isUnsafeSegment(segment)) return undefined;

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

  for (const segment of segments) {
    if (isUnsafeSegment(segment)) throw new PackageError('invalid_commit', { reason: 'unsafe_key' });
    if (/^\d+$/.test(segment)) {
      const pos = Number(segment);
      if (!Number.isSafeInteger(pos) || pos < 0 || pos > MAX_CMI_INDEX) {
        throw new PackageError('invalid_commit', { reason: 'index_out_of_bounds' });
      }
    }
  }

  let current: Record<string, unknown> | unknown[] = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextIsIndex = /^\d+$/.test(segments[index + 1]);

    if (Array.isArray(current)) {
      if (!/^\d+$/.test(segment)) {
        throw new PackageError('invalid_commit', { reason: 'array_index_required' });
      }

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
    if (!/^\d+$/.test(last)) {
      throw new PackageError('invalid_commit', { reason: 'array_index_required' });
    }

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
    if (value.length > MAX_CMI_INDEX + 1) {
      throw new PackageError('invalid_commit', { reason: 'index_out_of_bounds' });
    }

    return value.map((item) => normalizeValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const out: ScormCmi = {};

  for (const [key, entry] of Object.entries(value)) {
    if (isUnsafeSegment(key)) throw new PackageError('invalid_commit', { reason: 'unsafe_key' });

    if (/^\d+$/.test(key) && Number(key) > MAX_CMI_INDEX) {
      throw new PackageError('invalid_commit', { reason: 'index_out_of_bounds' });
    }

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

export interface ScormInteractionSummary {
  index: number;
  id: string | null;
  type: string | null;
  studentResponse: string | null;
  result: string | null;
  latency: string | null;
  description: string | null;
  correctResponse: string | null;
}

function interactionText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value);

  return text === '' ? null : text;
}

function correctPatternsOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => correctPatternsOf(entry));
  }

  if (isPlainObject(value)) {
    if ('pattern' in value) {
      const pattern = interactionText(value['pattern']);

      return pattern === null ? [] : [pattern];
    }

    return Object.keys(value)
      .filter((key) => /^\d+$/.test(key))
      .sort((left, right) => Number(left) - Number(right))
      .flatMap((key) => correctPatternsOf((value as ScormCmi)[key]));
  }

  return [];
}

function interactionSummaryOf(entry: unknown, index: number): ScormInteractionSummary {
  const record = (entry ?? {}) as Record<string, unknown>;
  const response = record['student_response'] ?? record['learner_response'];
  const patterns = correctPatternsOf(record['correct_responses']);
  const id = interactionText(record['id']);
  const type = interactionText(record['type']);
  const rawStudentResponse = response !== null && typeof response === 'object' ? JSON.stringify(response) : response;
  const studentResponse = interactionText(rawStudentResponse);
  const resultValue = record['result'];
  const rawResult = resultValue !== null && typeof resultValue === 'object' ? JSON.stringify(resultValue) : resultValue;
  const result = interactionText(rawResult);
  const latency = interactionText(record['latency'] ?? record['timestamp']);
  const description = interactionText(record['description']);
  const correctResponse = patterns.length === 0 ? null : patterns.join(', ');

  return { index, id, type, studentResponse, result, latency, description, correctResponse };
}

/**
 * Returns one entry per quiz answer the package reported, oldest first.
 */
export function summarizeInteractions(cmi: ScormCmi): ScormInteractionSummary[] {
  const raw = cmi['interactions'];

  if (Array.isArray(raw)) {
    return raw.map((entry, index) => interactionSummaryOf(entry, index));
  }

  if (isPlainObject(raw)) {
    return Object.keys(raw)
      .filter((key) => /^\d+$/.test(key))
      .sort((left, right) => Number(left) - Number(right))
      .map((key) => interactionSummaryOf((raw as ScormCmi)[key], Number(key)));
  }

  return [];
}

function indexKeyValue(key: string): number {
  const index = Number(key);

  if (!/^\d+$/.test(key) || !Number.isSafeInteger(index) || index > MAX_CMI_INDEX) {
    throw new PackageError('invalid_commit', { reason: 'index_out_of_bounds' });
  }

  return index;
}

function mergeIntoArray(stored: unknown[], entries: Array<[number, unknown]>): unknown[] {
  const merged = [...stored];

  for (const [index, value] of entries) {
    if (value === undefined) continue;

    merged[index] = index < merged.length ? mergeValues(merged[index], value) : value;
  }

  return merged;
}

function mergeIntoObject(stored: ScormCmi, entries: Array<[string, unknown]>): ScormCmi {
  const merged: ScormCmi = { ...stored };

  for (const [key, value] of entries) {
    if (isUnsafeSegment(key) || value === undefined) continue;

    merged[key] = key in merged ? mergeValues(merged[key], value) : value;
  }

  return merged;
}

function mergeValues(stored: unknown, incoming: unknown): unknown {
  if (Array.isArray(incoming) && Array.isArray(stored)) {
    return mergeIntoArray(stored, Array.from(incoming.entries()));
  }

  if (Array.isArray(incoming) && isPlainObject(stored)) {
    return mergeIntoObject(
      stored,
      Array.from(incoming.entries(), ([index, value]): [string, unknown] => [String(index), value])
    );
  }

  if (isPlainObject(incoming) && Array.isArray(stored)) {
    const keys = Object.keys(incoming);

    if (keys.every((key) => /^\d+$/.test(key))) {
      return mergeIntoArray(
        stored,
        keys.map((key): [number, unknown] => [indexKeyValue(key), incoming[key]])
      );
    }
  }

  if (isPlainObject(incoming) && isPlainObject(stored)) {
    return mergeIntoObject(stored, Object.entries(incoming));
  }

  return incoming;
}

/**
 * Merges one numbered commit over the stored CMI. Only present fields are
 * overwritten, so a commit may carry just the fields that changed. A
 * collection keeps its stored shape whether a commit sends it as an array or
 * as an object keyed by index.
 */
export function mergeCmi(stored: ScormCmi, commit: ScormCmi): ScormCmi {
  return mergeValues(stored, commit) as ScormCmi;
}

/** A commit is stale when its sequence does not advance past the stored one. */
export function isStaleCommit(seq: number, storedSeq: number | null | undefined): boolean {
  return storedSeq !== null && storedSeq !== undefined && seq <= storedSeq;
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

  const cmi = normalizeCmiShape(commit['cmi']);
  const terminateFlag = terminate === true;
  const beaconField = beacon === true ? { beacon: true as const } : {};
  const normalized: ScormCommit = { seq, cmi, terminate: terminateFlag, ...beaconField };

  if (new TextEncoder().encode(JSON.stringify(normalized)).length > MAX_COMMIT_JSON_BYTES) {
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

  if (max !== null && max > 0) {
    const effectiveMin = min ?? 0;

    if (max > effectiveMin) {
      return (raw - effectiveMin) / (max - effectiveMin);
    }
  }

  return raw / 100;
}

/**
 * Derives one module's outcome from stored CMI plus its unit's pass marks.
 */
export function moduleOutcomeFromCmi(
  cmi: ScormCmi,
  format: ScormPackageFormat,
  unit: Pick<ScormPackageUnit, 'masteryScoreRaw' | 'passingScoreScaled'>
): ScormModuleOutcome {
  if (format === 'scorm12') {
    const mapped = mapScorm12Outcome(getPath(cmi, 'core.lesson_status'));

    return {
      ...mapped,
      hasPassMark: unit.masteryScoreRaw !== null && unit.masteryScoreRaw !== undefined,
      scaledScore: scaledScore12(cmi)
    };
  }

  const mapped = mapScorm2004Outcome(getPath(cmi, 'completion_status'), getPath(cmi, 'success_status'));

  return {
    ...mapped,
    hasPassMark: unit.passingScoreScaled !== null && unit.passingScoreScaled !== undefined,
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
  unit: Pick<ScormPackageUnit, 'masteryScoreRaw' | 'passingScoreScaled' | 'completionThreshold'>,
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

    if (unit.masteryScoreRaw !== null && unit.masteryScoreRaw !== undefined) {
      const credit = getPath(next, 'core.credit');
      const creditAllows =
        credit === null || credit === undefined || credit === '' || String(credit).toLowerCase() === 'credit';
      const raw = asNumber(getPath(next, 'core.score.raw'));

      if (creditAllows && raw !== null) {
        setPath(next, 'core.lesson_status', raw >= unit.masteryScoreRaw ? 'passed' : 'failed');
      }
    }

    return next;
  }

  if (options.terminated) {
    const threshold = unit.completionThreshold;
    const progressMeasure = asNumber(getPath(next, 'progress_measure'));

    if (threshold !== null && threshold !== undefined && progressMeasure !== null) {
      setPath(next, 'completion_status', progressMeasure >= threshold ? 'completed' : 'incomplete');
    }

    const passingScore = unit.passingScoreScaled;
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

const SCORM12_SESSION_TIME_PATTERN = /^(\d{2,4}):(\d{2}):(\d{2})(?:\.\d{1,2})?$/;
const SCORM2004_DURATION_PATTERN =
  /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

/**
 * Parses a package-reported session time to whole seconds for SCORM 1.2
 * `HH:MM:SS[.SS]` and SCORM 2004 ISO-8601 durations. Returns null when the
 * value is missing or malformed.
 */
export function parseScormSessionTime(raw: unknown, format: ScormPackageFormat | 'scorm2004'): number | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const text = raw.trim();

  if (text === '') {
    return null;
  }

  if (format === 'scorm12') {
    const match = SCORM12_SESSION_TIME_PATTERN.exec(text);

    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);

    if (minutes > 59 || seconds > 59) {
      return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
  }

  const match = SCORM2004_DURATION_PATTERN.exec(text);

  if (!match) {
    return null;
  }

  if (match.slice(1).every((part) => part === undefined)) {
    return null;
  }

  const total =
    Number(match[1] ?? 0) * 365 * 86400 +
    Number(match[2] ?? 0) * 30 * 86400 +
    Number(match[3] ?? 0) * 86400 +
    Number(match[4] ?? 0) * 3600 +
    Number(match[5] ?? 0) * 60 +
    Number(match[6] ?? 0);

  return Number.isFinite(total) && total >= 0 ? Math.floor(total) : null;
}

/**
 * Formats a duration in seconds into a SCORM-compatible timespan:
 * - SCORM 1.2: `HHHH:MM:SS` (e.g. `0001:15:30`)
 * - SCORM 2004: ISO 8601 duration `PT[H]H[M]M[S]S` (e.g. `PT1H15M30S`, or `PT0S`)
 */
export function formatScormTime(seconds: number, format: ScormPackageFormat | 'scorm2004'): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (format === 'scorm12') {
    return `${String(hours).padStart(4, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  if (safeSeconds === 0) {
    return 'PT0S';
  }

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) duration += `${remainingSeconds}S`;
  return duration;
}

export const MAX_SCORM_TRY_SECONDS = 8 * 3600;
export const SCORM_HEARTBEAT_WINDOW_SECONDS = 300;
export const SCORM_DORMANT_CREDIT_SECONDS = 60;

/**
 * Reads the package-reported session time from one commit's CMI. Returns
 * null when absent or malformed.
 */
export function parseCommitSessionTime(cmi: ScormCmi, format: ScormPackageFormat): number | null {
  const raw = format === 'scorm12' ? getPath(cmi, 'core.session_time') : getPath(cmi, 'session_time');

  return parseScormSessionTime(raw, format);
}

/**
 * Reads the package-declared cumulative total time from one commit's CMI
 * (`cmi.core.total_time` for 1.2, `cmi.total_time` for 2004). Returns null
 * when absent or malformed.
 */
export function parseCommitTotalTime(cmi: ScormCmi, format: ScormPackageFormat): number | null {
  const raw = format === 'scorm12' ? getPath(cmi, 'core.total_time') : getPath(cmi, 'total_time');

  return parseScormSessionTime(raw, format);
}

/**
 * Returns the try's updated active seconds. Heartbeat wall-clock time always
 * accumulates, so resumed launches keep contributing; a valid
 * package-reported session time wins when it runs ahead of the heartbeat.
 * An explicit package total_time wins over both. Never decreases, capped.
 */
export function accumulateTryTime(
  currentSeconds: number,
  sessionTimeSeconds: number | null,
  lastActivityMs: number,
  nowMs: number,
  totalTimeSeconds: number | null = null
): number {
  const deltaSeconds = Math.max(0, Math.round((nowMs - lastActivityMs) / 1000));
  const credited = deltaSeconds <= SCORM_HEARTBEAT_WINDOW_SECONDS ? deltaSeconds : SCORM_DORMANT_CREDIT_SECONDS;
  const heartbeatTotal = Math.min(currentSeconds + credited, MAX_SCORM_TRY_SECONDS);

  const sessionTotal =
    sessionTimeSeconds !== null && sessionTimeSeconds > 0
      ? Math.min(sessionTimeSeconds, MAX_SCORM_TRY_SECONDS)
      : currentSeconds;

  const withoutTotal = Math.max(currentSeconds, heartbeatTotal, sessionTotal);

  if (totalTimeSeconds !== null && totalTimeSeconds > withoutTotal) {
    return Math.min(totalTimeSeconds, MAX_SCORM_TRY_SECONDS);
  }

  return withoutTotal;
}

/**
 * Returns whether an attempt meets the item's completion rule, given the
 * latest outcome of each launchable module.
 */
export function isScormRuleMet(settings: ScormRuleSettings, modules: ScormModuleOutcome[]): boolean {
  if (modules.length === 0) {
    return false;
  }

  const { rule, completionModules = 'all' } = settings;
  const graded = modules.filter(
    (module) => module.hasPassMark || module.success !== 'unknown' || module.scaledScore !== null
  );
  const targets = completionModules === 'graded_only' && graded.length > 0 ? graded : modules;

  if (rule === 'score') {
    const attemptScore = averageScaledScore(targets);
    const everyTargetCompleted = targets.every((module) => module.completion === 'completed');
    const scaledPercent = attemptScore === null ? null : Math.round(attemptScore * 10000) / 100;

    return everyTargetCompleted && scaledPercent !== null && scaledPercent + 1e-9 >= (settings.minScorePercent ?? 100);
  }

  return targets.every((module) => isModuleRuleMet(rule, module));
}

export interface ScormCommitOutcomeSnapshot {
  completion: ScormCompletionValue;
  success: ScormSuccessValue;
  scaledScore: number | null;
  tryStatus: ScormTryStatus;
}

export interface ScormCommitRecordContext {
  isFirstCommit: boolean;
  isTerminate: boolean;
  isBeacon: boolean;
  isRejected: boolean;
}

/**
 * Returns whether a commit writes a diagnostic event. Routine autocommits return false.
 */
export function shouldRecordCommitEvent(
  previous: ScormCommitOutcomeSnapshot,
  next: ScormCommitOutcomeSnapshot,
  context: ScormCommitRecordContext
): boolean {
  if (context.isRejected) {
    return true;
  }

  if (context.isFirstCommit) {
    return true;
  }

  if (context.isTerminate) {
    return true;
  }

  if (context.isBeacon) {
    return true;
  }

  if (previous.completion !== next.completion) {
    return true;
  }

  if (previous.success !== next.success) {
    return true;
  }

  if (previous.scaledScore !== next.scaledScore) {
    return true;
  }

  if (previous.tryStatus !== next.tryStatus) {
    return true;
  }

  return false;
}
