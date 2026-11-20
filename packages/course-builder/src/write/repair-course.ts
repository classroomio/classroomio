import type { LessonBlock, PackageCourse, PackageLesson, QuizQuestion } from '../package/schema';
import { lessonSources, type SectionBrief } from '../plan/briefs';
import {
  checkLesson,
  checkQuestion,
  courseQuestions,
  type CheckContext,
  type QuestionRef
} from '../verify/check-course';
import { isGrounded, withCorrectedCitations, type ClaimResult } from '../verify/claims';
import { codeChecks, withoutBadCitations, withoutUnreadLinks, withoutUnverifiedVideos } from '../verify/code-checks';
import { repairLoop } from '../verify/repair';
import { REPORT_ONLY_KINDS, type CheckIssue, type IssueKind, type StructuredCaller } from '../verify/types';
import { rewriteQuestion } from './quizzes';
import { rewritePassages, type CitedCaller, type CourseContext, type FlaggedPassage } from './section-writer';

export interface RepairCourseInput {
  course: PackageCourse;
  briefs: SectionBrief[];
  context: CourseContext;
  /** The checks' context; its lesson sources default to the briefs'. */
  checks: CheckContext;
  /** What `checkCourse` found. */
  issues: CheckIssue[];
  /** The checker's verdicts from `checkCourse`, by lesson key. */
  claims: ReadonlyMap<string, ClaimResult[]>;
  concurrency?: number;
  signal?: AbortSignal;
}

export interface RepairRemoval {
  target: string;
  /** `blocks` when only the text blocks holding unsupported claims were taken out of a lesson. */
  what: 'blocks' | 'lesson' | 'section' | 'question';
  reason: string;
}

export interface RepairedCourse {
  course: PackageCourse;
  repaired: string[];
  removed: RepairRemoval[];
  /** Citations extended in code because another block of the lesson's sources states the claim. */
  correctedCitations: number;
  /** Issues repair does not act on, for the build report. */
  reported: CheckIssue[];
  /** Model requests that failed during repair, by item. */
  failures: Array<{ target: string; reason: string }>;
}

const CODE_KINDS: ReadonlySet<IssueKind> = new Set<IssueKind>([
  'unknown-link',
  'excluded-citation',
  'missing-block',
  'unknown-name',
  'other-course'
]);
const DEFAULT_REPAIR_CONCURRENCY = 4;

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseQuestionTarget(target: string): { group: string; index: number } {
  const body = target.slice('question:'.length);
  const hash = body.lastIndexOf('#');

  return { group: body.slice(0, hash), index: Number(body.slice(hash + 1)) };
}

function flaggedPassages(lesson: PackageLesson, results: ClaimResult[]): FlaggedPassage[] {
  const problems = new Map<number, string[]>();
  for (const result of results.filter((entry) => !isGrounded(entry))) {
    const index = result.claim.blockIndex;
    problems.set(index, [...(problems.get(index) ?? []), `"${result.claim.text}": ${result.reason}`]);
  }

  return [...problems].flatMap(([blockIndex, reasons]) => {
    const block = lesson.blocks[blockIndex];
    if (!block || (block.type !== 'text' && block.type !== 'callout')) return [];

    return [{ blockIndex, html: block.html, problems: reasons }];
  });
}

function countCorrections(results: ClaimResult[]): number {
  return results.filter((result) => result.verdict === 'supported-elsewhere').length;
}

class CourseItems {
  constructor(readonly course: PackageCourse) {}

  lessons(): PackageLesson[] {
    return this.course.sections.flatMap((section) => section.lessons);
  }

  lesson(key: string): PackageLesson | undefined {
    return this.lessons().find((lesson) => lesson.key === key);
  }

  replaceLesson(lesson: PackageLesson): void {
    for (const section of this.course.sections)
      section.lessons = section.lessons.map((existing) => (existing.key === lesson.key ? lesson : existing));
  }

  questionList(group: string): QuizQuestion[] | undefined {
    if (group === 'final') return this.course.finalQuiz;
    if (group === 'practice') return this.course.practiceTasks;

    return this.course.sections.find((section) => section.key === group)?.check;
  }
}

/**
 * Repairs a checked course without losing supported text. In code: unread links, unverified videos, citations of excluded
 * or missing blocks are taken out, and a citation is extended wherever the checker found another block stating the
 * claim. Then only the flagged passages of a lesson are rewritten (role `repair`) from its section's sources, and each flagged
 * question from the sources it cites, then checked again, at most twice. A passage that still fails is taken out; a
 * lesson goes only when no text is left; a question that still fails goes. Report-only issues pass through untouched.
 */
export async function repairCourse(
  caller: CitedCaller & StructuredCaller,
  input: RepairCourseInput
): Promise<RepairedCourse> {
  const sources = input.checks.lessonSources ?? lessonSources(input.briefs);
  const checks: CheckContext = { ...input.checks, lessonSources: sources };
  const fetchedAt = input.context.fetchedAt;
  const items = new CourseItems(structuredClone(input.course));
  let correctedCitations = 0;
  const corrected = (lesson: PackageLesson, results: ClaimResult[]) => {
    correctedCitations += countCorrections(results);

    return withCorrectedCitations(lesson, results, sources.get(lesson.key) ?? [], fetchedAt);
  };

  for (const lesson of items.lessons()) {
    const cleaned = withoutBadCitations(withoutUnreadLinks(lesson, checks.allowedUrls), checks.blocks);
    items.replaceLesson(corrected(cleaned, input.claims.get(lesson.key) ?? []));
  }

  const issues = [...input.issues.filter((issue) => !CODE_KINDS.has(issue.kind)), ...codeChecks(items.course, checks)];
  const lastClaims = new Map(input.claims);
  const questionsAtStart = new Map(courseQuestions(items.course).map((ref) => [`${ref.group}#${ref.index}`, ref]));
  const failures: RepairedCourse['failures'] = [];

  const rewriteLesson = async (key: string) => {
    const lesson = items.lesson(key);
    const brief = input.briefs.find((candidate) => candidate.lessons.some((entry) => entry.key === key));
    const briefLesson = brief?.lessons.find((entry) => entry.key === key);
    if (!lesson || !brief || !briefLesson) return;

    const passages = flaggedPassages(lesson, lastClaims.get(key) ?? []);
    if (!passages.length) return;

    const rewritten = await rewritePassages(caller, input.context, brief, briefLesson.title, passages, {
      signal: input.signal
    });
    const blocks: LessonBlock[] = lesson.blocks.flatMap((block, index) => rewritten.get(index) ?? [block]);
    items.replaceLesson(withoutUnreadLinks({ ...lesson, blocks }, checks.allowedUrls));
  };

  const questionAt = (target: string): QuestionRef | null => {
    const { group, index } = parseQuestionTarget(target);
    const original = questionsAtStart.get(`${group}#${index}`);
    if (!original) return null;

    return { group, index, question: items.questionList(group)?.[index - 1] ?? original.question };
  };

  const briefsOfGroup = (group: string) => {
    const section = input.briefs.filter((brief) => brief.section.key === group);

    return section.length ? section : input.briefs;
  };

  const outcome = await repairLoop({
    issues: issues.filter((issue) => !REPORT_ONLY_KINDS.has(issue.kind)),
    concurrency: input.concurrency ?? DEFAULT_REPAIR_CONCURRENCY,
    repair: async (target, open) => {
      try {
        if (target.startsWith('lesson:')) {
          await rewriteLesson(target.slice('lesson:'.length));
          return;
        }

        const ref = questionAt(target);
        if (!ref) return;

        const problems = open.map((issue) => `${issue.kind}: ${issue.reason}`);
        const rewritten = await rewriteQuestion(caller, ref.question, briefsOfGroup(ref.group), problems, input.signal);
        if (rewritten) items.questionList(ref.group)![ref.index - 1] = rewritten;
      } catch (error) {
        failures.push({ target, reason: reasonOf(error) });
      }
    },
    recheck: async (target) => {
      try {
        if (target.startsWith('lesson:')) {
          const lesson = items.lesson(target.slice('lesson:'.length))!;
          const check = await checkLesson(caller, lesson, checks, input.signal);
          lastClaims.set(lesson.key, check.results);
          items.replaceLesson(corrected(lesson, check.results));

          return check.issues.filter((issue) => !REPORT_ONLY_KINDS.has(issue.kind));
        }

        const ref = questionAt(target);

        return ref ? await checkQuestion(caller, ref, checks.blocks, input.signal) : [];
      } catch (error) {
        failures.push({ target, reason: reasonOf(error) });

        return [{ target, kind: 'unsupported-claim', reason: 'could not be checked again' }];
      }
    }
  });

  const removed = removeFailing(items, outcome.removed, lastClaims);
  for (const lesson of items.lessons()) items.replaceLesson(withoutUnverifiedVideos(lesson, checks.allowedUrls));

  return {
    course: items.course,
    repaired: outcome.repaired,
    removed,
    correctedCitations,
    reported: issues.filter((issue) => REPORT_ONLY_KINDS.has(issue.kind)),
    failures
  };
}

function removeFailing(
  items: CourseItems,
  failing: Array<{ target: string; reason: string }>,
  lastClaims: ReadonlyMap<string, ClaimResult[]>
): RepairRemoval[] {
  const removed: RepairRemoval[] = [];
  const dropQuestions = new Map<string, Set<number>>();

  for (const { target, reason } of failing) {
    if (target.startsWith('question:')) {
      const { group, index } = parseQuestionTarget(target);
      dropQuestions.set(group, (dropQuestions.get(group) ?? new Set()).add(index));
      removed.push({ target, what: 'question', reason });
      continue;
    }

    const key = target.slice('lesson:'.length);
    const lesson = items.lesson(key);
    if (!lesson) continue;

    const ungrounded = new Set(
      (lastClaims.get(key) ?? []).filter((result) => !isGrounded(result)).map((result) => result.claim.blockIndex)
    );
    const kept = lesson.blocks.filter((_, index) => !ungrounded.has(index));
    if (kept.some((block) => block.type === 'text' || block.type === 'callout')) {
      if (ungrounded.size) {
        items.replaceLesson({ ...lesson, blocks: kept });
        removed.push({ target, what: 'blocks', reason });
      }
      continue;
    }

    for (const section of items.course.sections) section.lessons = section.lessons.filter((entry) => entry.key !== key);
    removed.push({ target, what: 'lesson', reason });
  }

  for (const [group, indexes] of dropQuestions) {
    const list = items.questionList(group);
    if (!list) continue;

    const kept = list.filter((_, position) => !indexes.has(position + 1));
    list.splice(0, list.length, ...kept);
  }

  for (const section of items.course.sections.filter((entry) => !entry.lessons.length))
    removed.push({ target: `section:${section.key}`, what: 'section', reason: 'every lesson was removed' });
  items.course.sections = items.course.sections.filter((section) => section.lessons.length);

  return removed;
}
