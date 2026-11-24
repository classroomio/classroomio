import * as z from 'zod/v4';

import type { PackageCourse, QuizQuestion } from '../package/schema';
import type { StructuredCaller } from './types';

export const ZReviewFixes = z.object({
  fixes: z.array(
    z.object({
      kind: z.enum([
        'merge-sections',
        'reorder',
        'drop-lesson',
        'retitle',
        'move-question',
        'drop-question',
        'flag-gap'
      ]),
      target: z.string(),
      detail: z.string()
    })
  )
});

export type ReviewFix = z.infer<typeof ZReviewFixes>['fixes'][number];

export const REVIEWER_SYSTEM = [
  'You review one generated course as its editor. You see its outline, which source topics it covers, what the checks',
  'found, and the start of each lesson. Return only fixes that make the course clearly better for a new user of the product.',
  'Name items by their keys. reorder: target is a section key and detail lists all its lesson keys, comma-separated, in the',
  'new order; or target is "course" and detail lists all section keys in the new order. retitle: target is a section or',
  'lesson key and detail is the new title. drop-lesson: target is a lesson key and detail is why. move-question: target is',
  '"<section key>#<question number>" and detail is the section key it belongs in, or "final". drop-question: target is',
  '"<section key>#<question number>" or "final#<question number>" and detail is why; use it for a question that asks the',
  'same fact as another question of the course, keeping the better one. merge-sections: target is two section keys,',
  'comma-separated, the first one keeping its title, and detail is why. flag-gap: target is the missing topic and detail',
  'is what is missing.',
  'Never invent content: only rearrange, rename, remove or flag.'
].join(' ');

export interface ReviewInput {
  course: PackageCourse;
  /** Source topics against the lessons that cover them, written by the planner. */
  coverage: string;
  /** What the claim, key and code checks found and what repair did. */
  checkerReport: string;
}

const LESSON_PREVIEW_CHARS = 300;

function outline(course: PackageCourse): string {
  return course.sections
    .map((section) => {
      const lessons = section.lessons.map((lesson) => {
        const text = lesson.blocks
          .map((block) => (block.type === 'text' || block.type === 'callout' ? block.html : ''))
          .join(' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, LESSON_PREVIEW_CHARS);

        return `  - ${lesson.key}: ${lesson.title}\n    ${text}`;
      });
      const checks = section.check.map((question, index) => `  ? ${section.key}#${index + 1}: ${question.prompt}`);

      return [`${section.key}: ${section.title}`, ...lessons, ...checks].join('\n');
    })
    .concat(course.finalQuiz.map((question, index) => `? final#${index + 1}: ${question.prompt}`))
    .join('\n');
}

export async function reviewCourse(
  caller: StructuredCaller,
  input: ReviewInput,
  signal?: AbortSignal
): Promise<ReviewFix[]> {
  const prompt = `COURSE: ${input.course.title}\n\nOUTLINE:\n${outline(input.course)}\n\nCOVERAGE:\n${input.coverage}\n\nCHECKS:\n${input.checkerReport}`;
  const result = await caller.structured({
    role: 'reviewer',
    system: REVIEWER_SYSTEM,
    content: [{ type: 'text', text: prompt }],
    schema: ZReviewFixes,
    signal
  });

  return result.fixes;
}

export interface AppliedReview {
  course: PackageCourse;
  /** Sections merged: the second one's lessons and questions moved to the end of the first. */
  merges: Array<{ sectionKeys: [string, string]; reason: string }>;
  gaps: Array<{ topic: string; detail: string }>;
  removed: Array<{ kind: 'section' | 'lesson' | 'question'; target: string; reason: string }>;
  /** Fixes that named an item the course does not have, or were malformed. Never applied. */
  rejected: Array<{ fix: ReviewFix; reason: string }>;
}

function sameKeys(left: string[], right: string[]): boolean {
  return left.length === right.length && [...left].sort().join('\n') === [...right].sort().join('\n');
}

/**
 * Applies the reviewer's fixes in code: reorder, retitle, drop a lesson or question, move a question, merge two sections.
 * Gaps are returned for the report. A fix that names an unknown item, or reorders without listing every item, is
 * rejected rather than guessed at. A section left with no lessons is removed.
 */
export function applyReviewFixes(source: PackageCourse, fixes: ReviewFix[]): AppliedReview {
  const course: PackageCourse = structuredClone(source);
  const applied: AppliedReview = { course, merges: [], gaps: [], removed: [], rejected: [] };
  const reject = (fix: ReviewFix, reason: string) => applied.rejected.push({ fix, reason });
  const sectionOf = (key: string) => course.sections.find((section) => section.key === key);
  const lessonOf = (key: string) =>
    course.sections
      .flatMap((section) => section.lessons.map((lesson) => ({ section, lesson })))
      .find((entry) => entry.lesson.key === key);
  const moves: Array<{ fix: ReviewFix; question: QuizQuestion; from: string }> = [];
  const drops: QuizQuestion[] = [];
  const questionAt = (target: string) => {
    const [group, number] = target.split('#');
    const list = group === 'final' ? course.finalQuiz : sectionOf(group)?.check;

    return list?.[Number(number) - 1];
  };

  for (const fix of fixes) {
    const keys = fix.detail
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    switch (fix.kind) {
      case 'reorder': {
        if (fix.target === 'course') {
          if (
            !sameKeys(
              keys,
              course.sections.map((section) => section.key)
            )
          ) {
            reject(fix, 'the new order must list every section once');
            break;
          }
          course.sections = keys.map((key) => sectionOf(key)!);
          break;
        }

        const section = sectionOf(fix.target);
        if (
          !section ||
          !sameKeys(
            keys,
            section.lessons.map((lesson) => lesson.key)
          )
        ) {
          reject(fix, 'the new order must list every lesson of an existing section once');
          break;
        }
        section.lessons = keys.map((key) => section.lessons.find((lesson) => lesson.key === key)!);
        break;
      }
      case 'retitle': {
        const item = sectionOf(fix.target) ?? lessonOf(fix.target)?.lesson;
        if (!item || !fix.detail.trim()) {
          reject(fix, 'no section or lesson has this key, or the title is empty');
          break;
        }
        item.title = fix.detail.trim();
        break;
      }
      case 'drop-lesson': {
        const entry = lessonOf(fix.target);
        if (!entry) {
          reject(fix, 'no lesson has this key');
          break;
        }
        entry.section.lessons = entry.section.lessons.filter((lesson) => lesson.key !== fix.target);
        applied.removed.push({ kind: 'lesson', target: fix.target, reason: fix.detail });
        break;
      }
      case 'move-question': {
        const [sectionKey, number] = fix.target.split('#');
        const question = sectionOf(sectionKey)?.check[Number(number) - 1];
        const destinationExists = fix.detail.trim() === 'final' || sectionOf(fix.detail.trim());
        if (!question || !destinationExists) {
          reject(fix, 'the question or its destination does not exist');
          break;
        }
        moves.push({ fix, question, from: sectionKey });
        break;
      }
      case 'drop-question': {
        const question = questionAt(fix.target.trim());
        if (!question) {
          reject(fix, 'no question has this number');
          break;
        }
        drops.push(question);
        applied.removed.push({ kind: 'question', target: fix.target.trim(), reason: fix.detail });
        break;
      }
      case 'merge-sections': {
        const [first, second] = fix.target.split(',').map((key) => key.trim());
        if (!first || !second || first === second || !sectionOf(first) || !sectionOf(second)) {
          reject(fix, 'merging needs two different existing section keys');
          break;
        }
        applied.merges.push({ sectionKeys: [first, second], reason: fix.detail });
        break;
      }
      case 'flag-gap':
        applied.gaps.push({ topic: fix.target, detail: fix.detail });
        break;
    }
  }

  for (const section of course.sections) section.check = section.check.filter((question) => !drops.includes(question));
  course.finalQuiz = course.finalQuiz.filter((question) => !drops.includes(question));

  for (const { fix, question, from } of moves) {
    if (drops.includes(question)) continue;

    const origin = sectionOf(from)!;
    origin.check = origin.check.filter((entry) => entry !== question);
    if (fix.detail.trim() === 'final') course.finalQuiz.push(question);
    else sectionOf(fix.detail.trim())!.check.push(question);
  }

  for (const { sectionKeys } of applied.merges) {
    const [first, second] = sectionKeys.map((key) => sectionOf(key));
    if (!first || !second) continue;

    first.lessons.push(...second.lessons);
    first.check.push(...second.check);
    course.sections = course.sections.filter((section) => section !== second);
  }

  for (const section of course.sections.filter((entry) => !entry.lessons.length)) {
    applied.removed.push({ kind: 'section', target: section.key, reason: 'every lesson was dropped' });
  }
  course.sections = course.sections.filter((section) => section.lessons.length);

  return applied;
}
