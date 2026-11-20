import type * as z from 'zod/v4';

import type { ClaudeRequest } from '../llm/claude';

/** The one model call the checks need. `ClaudeClient` satisfies it; tests pass a fake. */
export interface StructuredCaller {
  structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }): Promise<z.infer<Schema>>;
}

/** One block of the corpus as the checks see it. */
export interface SourceBlock {
  id: string;
  text: string;
  pageUrl: string;
  kind: string;
  stepNumber?: number;
  /** Set when the page the block sits on is excluded from teaching. */
  excluded: string | null;
}

export type BlockLookup = ReadonlyMap<string, SourceBlock>;

export const ISSUE_KINDS = [
  'unsupported-claim',
  'wrong-key',
  'ambiguous-option',
  'wrong-order',
  'unknown-link',
  'excluded-citation',
  'missing-block',
  'unknown-name',
  'other-course'
] as const;

export type IssueKind = (typeof ISSUE_KINDS)[number];

/**
 * Issues the build report lists but repair does not act on: a name the glossary lacks is often the writer's own label,
 * and a role or area can share its name with another course.
 */
export const REPORT_ONLY_KINDS: ReadonlySet<IssueKind> = new Set<IssueKind>(['unknown-name', 'other-course']);

/**
 * A problem found in one item. `target` names the item: `lesson:<lessonKey>` or `question:<sectionKey|final|practice>#<index>`.
 */
export interface CheckIssue {
  target: string;
  kind: IssueKind;
  reason: string;
}

export function lessonTarget(lessonKey: string): string {
  return `lesson:${lessonKey}`;
}

export function questionTarget(group: string, index: number): string {
  return `question:${group}#${index}`;
}
