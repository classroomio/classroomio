import type {
  AgentRunDetail,
  AgentRunStep,
  AiAssistantMessage,
  AiAssistantRunSummaryMetadata,
  AiAssistantRunSummaryStatus,
  RunChangeAction,
  RunChangedItem
} from './types';

/**
 * Look up an exercise title by id. Caller supplies the function — keeps this
 * file decoupled from any specific course shape on the dashboard side.
 */
export type ExerciseTitleLookup = (exerciseId: string) => string | undefined;

const STATUSES_TERMINAL: ReadonlySet<AiAssistantRunSummaryStatus> = new Set([
  'completed',
  'failed',
  'canceled',
  'paused'
]);

export function isRunSummaryStatus(status: string | undefined | null): status is AiAssistantRunSummaryStatus {
  return !!status && STATUSES_TERMINAL.has(status as AiAssistantRunSummaryStatus);
}

/**
 * Aggregate tool-call counts from a run's checkpointed steps into the four
 * categories the summary message surfaces (sections / lessons / exercises /
 * question blocks). Anything else the worker did is intentionally omitted —
 * the message should read at a glance, not log every tool call.
 */
function countToolCalls(runDetail: AgentRunDetail): AiAssistantRunSummaryMetadata['counts'] {
  const counts: Required<AiAssistantRunSummaryMetadata['counts']> = {
    sections: 0,
    lessons: 0,
    exercises: 0,
    questionBlocks: 0
  };

  for (const step of runDetail.steps) {
    if (step.status !== 'completed') continue;
    const toolName = step.stepType.startsWith('tool:') ? step.stepType.slice('tool:'.length) : null;
    if (!toolName) continue;

    if (toolName === 'create_section') counts.sections += 1;
    else if (toolName === 'create_lesson') counts.lessons += 1;
    else if (toolName === 'create_exercise') counts.exercises += 1;
    else if (toolName === 'add_questions') counts.questionBlocks += 1;
  }

  // Trim zeros so consumers can render only what was actually created.
  const trimmed: AiAssistantRunSummaryMetadata['counts'] = {};
  if (counts.sections) trimmed.sections = counts.sections;
  if (counts.lessons) trimmed.lessons = counts.lessons;
  if (counts.exercises) trimmed.exercises = counts.exercises;
  if (counts.questionBlocks) trimmed.questionBlocks = counts.questionBlocks;

  return trimmed;
}

function getStepToolName(step: AgentRunStep): string | null {
  if (!step.stepType.startsWith('tool:')) return null;
  return step.stepType.slice('tool:'.length);
}

function getStepResult(step: AgentRunStep): Record<string, unknown> | null {
  const output = step.output as { result?: unknown } | null;
  if (!output || typeof output !== 'object') return null;
  const result = output.result;
  if (!result || typeof result !== 'object') return null;
  return result as Record<string, unknown>;
}

function getStepArgs(step: AgentRunStep): Record<string, unknown> | null {
  const input = step.input as { args?: unknown } | null;
  if (!input || typeof input !== 'object') return null;
  const args = input.args;
  if (!args || typeof args !== 'object') return null;
  return args as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Add an action to an existing changed item, dedup-aware. `questions_added`
 * and `questions_updated` accumulate counts; the rest are flagged once.
 */
function mergeAction(item: RunChangedItem, action: RunChangeAction): void {
  if (action.kind === 'questions_added' || action.kind === 'questions_updated') {
    const existing = item.actions.find((a) => a.kind === action.kind) as
      | { kind: typeof action.kind; count: number }
      | undefined;

    if (existing) {
      existing.count += action.count;
      return;
    }

    item.actions.push(action);
    return;
  }

  if (item.actions.some((a) => a.kind === action.kind)) return;
  item.actions.push(action);
}

/**
 * Source-agnostic aggregator. Caller hands a stream of `{ tool, result, args }`
 * tuples (one per completed tool call) and gets back the per-item summary used
 * by the changes card. Lets the same mapping table serve both run steps and
 * inline chat-mode tool parts.
 */
interface ToolCallView {
  tool: string;
  result: Record<string, unknown> | null;
  args: Record<string, unknown> | null;
}

function aggregateToolCalls(
  calls: Iterable<ToolCallView>,
  resolveExerciseTitle: ExerciseTitleLookup
): RunChangedItem[] {
  const byKey = new Map<string, RunChangedItem>();

  function upsert(
    targetType: 'lesson' | 'exercise',
    targetId: string,
    titleFromStep: string | null,
    action: RunChangeAction,
    tokensDelta: number | null
  ): void {
    const key = `${targetType}:${targetId}`;
    let item = byKey.get(key);

    if (!item) {
      const title =
        titleFromStep ?? (targetType === 'exercise' ? (resolveExerciseTitle(targetId) ?? 'Exercise') : 'Lesson');
      item = { targetType, targetId, title, actions: [] };
      byKey.set(key, item);
    } else if (titleFromStep && (item.title === 'Lesson' || item.title === 'Exercise')) {
      item.title = titleFromStep;
    }

    mergeAction(item, action);

    if (tokensDelta !== null && tokensDelta > 0) {
      item.tokens = (item.tokens ?? 0) + tokensDelta;
    }
  }

  for (const { tool, result, args } of calls) {
    if (tool === 'create_lesson' || tool === 'update_lesson') {
      const id = asString(result?.id);
      if (!id) continue;
      upsert(
        'lesson',
        id,
        asString(result?.title),
        tool === 'create_lesson' ? { kind: 'created' } : { kind: 'metadata_updated' },
        null
      );
    } else if (tool === 'update_lesson_content') {
      const id = asString(result?.lessonId);
      if (!id) continue;
      const contentLength = asNumber(result?.contentLength);
      const tokens = contentLength !== null ? Math.ceil(contentLength / 4) : null;
      upsert('lesson', id, asString(result?.lessonTitle), { kind: 'content_written' }, tokens);
    } else if (tool === 'create_exercise' || tool === 'update_exercise') {
      const id = asString(result?.id);
      if (!id) continue;
      upsert(
        'exercise',
        id,
        asString(result?.title),
        tool === 'create_exercise' ? { kind: 'created' } : { kind: 'metadata_updated' },
        null
      );
    } else if (tool === 'add_questions') {
      const id = asString(result?.exerciseId);
      if (!id) continue;
      const count = asNumber(result?.addedCount) ?? 0;
      if (count <= 0) continue;
      upsert('exercise', id, asString(result?.exerciseTitle), { kind: 'questions_added', count }, count);
    } else if (tool === 'update_questions') {
      const id = asString(result?.exerciseId);
      if (!id) continue;
      const count = asNumber(result?.updatedCount) ?? 0;
      if (count <= 0) continue;
      upsert('exercise', id, asString(result?.exerciseTitle), { kind: 'questions_updated', count }, count);
    } else if (tool === 'create_exercise_section' || tool === 'update_exercise_section') {
      const id = asString(args?.exerciseId);
      if (!id) continue;
      upsert(
        'exercise',
        id,
        null,
        tool === 'create_exercise_section' ? { kind: 'section_added' } : { kind: 'section_edited' },
        null
      );
    }
  }

  return Array.from(byKey.values());
}

/**
 * Walk a run's completed tool steps and aggregate them into a list of unique
 * lesson/exercise items with the actions performed on each. Sections,
 * landing-page edits, structure reads, etc. are intentionally dropped — the
 * UI surface is "what content did the teacher just get".
 */
export function extractChangedItems(
  runDetail: AgentRunDetail,
  resolveExerciseTitle: ExerciseTitleLookup = () => undefined
): RunChangedItem[] {
  function* toCalls(): Generator<ToolCallView> {
    for (const step of runDetail.steps) {
      if (step.status !== 'completed') continue;
      const tool = getStepToolName(step);
      if (!tool) continue;
      yield { tool, result: getStepResult(step), args: getStepArgs(step) };
    }
  }

  return aggregateToolCalls(toCalls(), resolveExerciseTitle);
}

/**
 * Same aggregation, but sourced from inline chat-mode tool parts on
 * `AiAssistantMessage.parts`. Chat parts use `type: 'tool-<name>'`, place the
 * tool's return value directly on `part.output` (no `result` wrapper), and
 * carry tool args directly on `part.input` (no `args` wrapper) — so we adapt
 * to those shapes before delegating to the shared aggregator.
 */
export function extractChangedItemsFromMessages(
  messages: AiAssistantMessage[],
  resolveExerciseTitle: ExerciseTitleLookup = () => undefined
): RunChangedItem[] {
  function* toCalls(): Generator<ToolCallView> {
    for (const message of messages) {
      const parts = (message as { parts?: unknown }).parts;
      if (!Array.isArray(parts)) continue;

      for (const part of parts) {
        if (!isRecord(part)) continue;
        const type = typeof part.type === 'string' ? part.type : '';
        if (!type.startsWith('tool-')) continue;
        if (part.state !== 'output-available') continue;

        const tool = type.slice('tool-'.length);
        const result = isRecord(part.output) ? part.output : null;
        const args = isRecord(part.input) ? part.input : null;
        yield { tool, result, args };
      }
    }
  }

  return aggregateToolCalls(toCalls(), resolveExerciseTitle);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export interface BuildRunSummaryInput {
  runDetail: AgentRunDetail;
  resolveExerciseTitle?: ExerciseTitleLookup;
}

/**
 * Build the metadata block that gets attached to the synthetic summary
 * message. Caller is responsible for formatting it into i18n text.
 */
export function buildRunSummaryMetadata({
  runDetail,
  resolveExerciseTitle
}: BuildRunSummaryInput): AiAssistantRunSummaryMetadata | null {
  const status = runDetail.run.status;
  if (!isRunSummaryStatus(status)) return null;

  const changes = extractChangedItems(runDetail, resolveExerciseTitle);

  return {
    runId: runDetail.run.id,
    status,
    counts: countToolCalls(runDetail),
    changes: changes.length > 0 ? changes : undefined,
    finishedAt: runDetail.run.finishedAt ?? new Date().toISOString(),
    error: runDetail.run.lastError?.message
  };
}

export function formatRunSummaryCounts(counts: AiAssistantRunSummaryMetadata['counts']): string {
  const parts: string[] = [];

  if (counts.sections) parts.push(`${counts.sections} section${counts.sections === 1 ? '' : 's'}`);
  if (counts.lessons) parts.push(`${counts.lessons} lesson${counts.lessons === 1 ? '' : 's'}`);
  if (counts.exercises) parts.push(`${counts.exercises} exercise${counts.exercises === 1 ? '' : 's'}`);
  if (counts.questionBlocks) {
    parts.push(`${counts.questionBlocks} question block${counts.questionBlocks === 1 ? '' : 's'}`);
  }

  return parts.join(', ');
}
