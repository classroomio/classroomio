import type { PackageCourse, PackageLesson, QuizQuestion } from '../package/schema';
import { mapLimit } from '../util/map-limit';
import { checkAnswerKey } from './answer-keys';
import { checkLessonClaims, type ClaimResult, type ClaimSource } from './claims';
import { lessonCodeChecks, type CodeCheckContext } from './code-checks';
import { questionTarget, type BlockLookup, type CheckIssue, type StructuredCaller } from './types';

export interface QuestionRef {
  /** A section key, `final` or `practice`. */
  group: string;
  /** 1-based position within its group. */
  index: number;
  question: QuizQuestion;
}

/** Every question of a course with the group and position its check target names. */
export function courseQuestions(course: PackageCourse): QuestionRef[] {
  const group = (name: string, questions: QuizQuestion[]) =>
    questions.map((question, position) => ({ group: name, index: position + 1, question }));

  return [
    ...course.sections.flatMap((section) => group(section.key, section.check)),
    ...group('final', course.finalQuiz),
    ...group('practice', course.practiceTasks)
  ];
}

export interface CheckContext extends CodeCheckContext {
  /** Each lesson's source ranges by lesson key (`lessonSources`); without them claims are checked on their citations only. */
  lessonSources?: ReadonlyMap<string, ClaimSource[]>;
}

export interface LessonCheck {
  results: ClaimResult[];
  issues: CheckIssue[];
}

/** The claim check and the code checks of one lesson. */
export async function checkLesson(
  caller: StructuredCaller,
  lesson: PackageLesson,
  context: CheckContext,
  signal?: AbortSignal
): Promise<LessonCheck> {
  const sources = context.lessonSources?.get(lesson.key);
  const claims = await checkLessonClaims(caller, lesson, context.blocks, { sources, signal });

  return { results: claims.results, issues: [...claims.issues, ...lessonCodeChecks(lesson, context)] };
}

/** The answer-key check of one question. */
export function checkQuestion(
  caller: StructuredCaller,
  ref: QuestionRef,
  blocks: BlockLookup,
  signal?: AbortSignal
): Promise<CheckIssue[]> {
  return checkAnswerKey(caller, ref.question, { group: ref.group, index: ref.index }, blocks, signal);
}

export interface CourseCheck {
  issues: CheckIssue[];
  /** The checker's verdict on every claim, by lesson key. */
  claims: Map<string, ClaimResult[]>;
  /** Items whose check request failed, with why; they are neither passed nor flagged. */
  unchecked: Array<{ target: string; reason: string }>;
}

const DEFAULT_CHECK_CONCURRENCY = 8;

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs every check of a course: claims and code checks per lesson, the key of every question, `concurrency` at a time. */
export async function checkCourse(
  caller: StructuredCaller,
  course: PackageCourse,
  context: CheckContext,
  options: { concurrency?: number; signal?: AbortSignal } = {}
): Promise<CourseCheck> {
  const concurrency = options.concurrency ?? DEFAULT_CHECK_CONCURRENCY;
  const lessons = course.sections.flatMap((section) => section.lessons);
  const questions = courseQuestions(course);
  const unchecked: CourseCheck['unchecked'] = [];

  const [lessonChecks, questionIssues] = await Promise.all([
    mapLimit(lessons, concurrency, (lesson) =>
      checkLesson(caller, lesson, context, options.signal).catch((error): LessonCheck => {
        unchecked.push({ target: `lesson:${lesson.key}`, reason: reasonOf(error) });

        return { results: [], issues: lessonCodeChecks(lesson, context) };
      })
    ),
    mapLimit(questions, concurrency, (ref) =>
      checkQuestion(caller, ref, context.blocks, options.signal).catch((error): CheckIssue[] => {
        unchecked.push({ target: questionTarget(ref.group, ref.index), reason: reasonOf(error) });

        return [];
      })
    )
  ]);

  return {
    issues: [...lessonChecks.flatMap((check) => check.issues), ...questionIssues.flat()],
    claims: new Map(lessons.map((lesson, index) => [lesson.key, lessonChecks[index].results])),
    unchecked
  };
}
