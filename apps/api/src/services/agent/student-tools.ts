import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import type { AiTutorSettings } from '@cio/ai-assistant';
import { getQuestionTypeById, type DbQuestionForScoring } from '@cio/question-types';
import { checkMathSteps, compareMathExpressions } from '@cio/question-types/math-grading';
import type { TAgentCurrentAttempt } from '@cio/utils/validation/agent';

import { getLesson } from '@cio/core/services/lesson/lesson';
import { getLessonNoteHtml } from '@cio/core/services/block/block-text';
import { getLessonVideoTranscript } from '@cio/core/services/agent/lesson-transcript';
import { getExercise } from '@cio/core/services/exercise/exercise';
import { getCourseOutlineSummary } from '@cio/core/services/course/outline';
import { getStudentSkillMastery } from '@api/services/skill/mastery';
import { getStudentSubmissionReview } from '@api/services/submission/student-submission';
import { AppError } from '@api/utils/errors';
import {
  BLOCKED_GUIDANCE,
  answerGuidance,
  describeMisconception,
  gradeCurrentInput,
  isHelpBlocked,
  stepsGuidance
} from './math-tutor';
import { AgentEvent, trackAgentEvent } from '@cio/core/utils/tinybird';
import { verifyExerciseBelongsToCourse, verifyLessonBelongsToCourse } from '@cio/core/services/agent/chat-context';

/**
 * Student agent tools — read-only, course-scoped.
 *
 * Every tool re-verifies the resource belongs to `courseId` so a poisoned model
 * cannot reach into other courses or other learners' data. Exercise reads strip
 * answer keys and per-question scoring data before returning.
 */

const SEARCH_SNIPPET_RADIUS = 80;

function logToolEvent(
  phase: 'start' | 'success' | 'error',
  toolName: string,
  details: { orgId: string; userId: string; courseId: string; args?: unknown; error?: unknown }
) {
  const base = `[student-tool:${phase}] ${toolName}`;

  if (phase === 'error') {
    console.error(base, {
      courseId: details.courseId,
      userId: details.userId,
      args: details.args,
      error: details.error instanceof Error ? details.error.message : details.error
    });
    return;
  }

  console.info(base, {
    courseId: details.courseId,
    userId: details.userId
  });
}

async function executeStudentTool<T>(
  toolName: string,
  ctx: { orgId: string; userId: string; courseId: string; args?: unknown },
  execute: () => Promise<T>
): Promise<T> {
  trackAgentEvent(AgentEvent.TOOL_CALLED, {
    orgId: ctx.orgId,
    userId: ctx.userId,
    courseId: ctx.courseId,
    toolName
  });
  logToolEvent('start', toolName, ctx);

  try {
    const result = await execute();
    trackAgentEvent(AgentEvent.TOOL_COMPLETED, {
      orgId: ctx.orgId,
      userId: ctx.userId,
      courseId: ctx.courseId,
      toolName,
      success: true
    });
    logToolEvent('success', toolName, ctx);

    return result;
  } catch (error) {
    logToolEvent('error', toolName, { ...ctx, error });

    if (error instanceof AppError) throw error;
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function stripAnswerKeysFromQuestion(question: {
  id: number | string;
  title: string;
  questionTypeId: number;
  order: number | null;
  points: number | null;
  options?: { label: string | null }[];
}): {
  id: number | string;
  question: string;
  questionTypeId: number;
  order: number | null;
  options: { label: string }[];
} {
  return {
    id: question.id,
    question: question.title,
    questionTypeId: question.questionTypeId,
    order: question.order,
    options: (question.options ?? []).filter((o) => o.label != null).map((o) => ({ label: o.label as string }))
  };
}

function makeSnippet(text: string, query: string, radius: number = SEARCH_SNIPPET_RADIUS): string {
  if (!text) return '';
  const normalized = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const lower = normalized.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) return normalized.slice(0, radius * 2) + (normalized.length > radius * 2 ? '…' : '');

  const start = Math.max(0, idx - radius);
  const end = Math.min(normalized.length, idx + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalized.length ? '…' : '';
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

const listCourseOutlineParam = z.object({});
const readMySkillMasteryParam = z.object({});
const readLessonParam = z.object({ lessonId: z.string() });
const readExerciseParam = z.object({ exerciseId: z.string() });
const readMySubmissionsParam = z.object({
  exerciseId: z.string(),
  attempt: z.number().int().min(1).optional()
});
const emptyParam = z.object({});
const checkMathStepParam = z.object({
  lines: z.array(z.string().min(1).max(500)).max(30).optional(),
  startingExpression: z.string().max(500).optional()
});
const compareMathExpressionsParam = z.object({ left: z.string().min(1).max(500), right: z.string().min(1).max(500) });
const searchCourseParam = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(20).default(8)
});

export type StudentAttemptContext = { exerciseId?: string; currentAttempt?: TAgentCurrentAttempt };

/** Builds the read-only student tools scoped to one course and learner. */
export function buildStudentAgentTools(
  orgId: string,
  userId: string,
  courseId: string,
  settings: AiTutorSettings,
  attemptContext: StudentAttemptContext = {}
) {
  const mode = settings.assessmentMode;

  async function loadCurrentAttempt() {
    const { exerciseId, currentAttempt } = attemptContext;
    if (!exerciseId || !currentAttempt) return null;

    await verifyExerciseBelongsToCourse(exerciseId, courseId);
    const exercise = await getExercise(exerciseId);
    const question = (exercise.questions ?? []).find((candidate) => Number(candidate.id) === currentAttempt.questionId);
    if (!question) return null;

    return {
      exerciseTitle: exercise.title,
      question: question as unknown as DbQuestionForScoring,
      input: currentAttempt.answer ?? { type: '' }
    };
  }

  const noAttempt = {
    available: false as const,
    guidance:
      'The learner has no unsubmitted question open. Ask which question they mean, or use read_exercise for the exercise prompt.'
  };
  const blocked = { available: false as const, allowed: false as const, guidance: BLOCKED_GUIDANCE };

  return {
    list_course_outline: tool({
      description:
        'List the course outline in course order: sections with their lessons and exercises, and lessons or exercises outside any section in their place. The courseId is automatically scoped — do not pass it. Returns titles and ids only.',
      inputSchema: listCourseOutlineParam,
      execute: async () => {
        return executeStudentTool('list_course_outline', { orgId, userId, courseId }, async () => {
          const outline = await getCourseOutlineSummary(courseId);

          return { outline };
        });
      }
    }),

    read_lesson: tool({
      description:
        'Read the title and body of a specific lesson in the current course. Use this when the learner refers to a lesson that is not already loaded in your context.',
      inputSchema: readLessonParam,
      execute: async (args) => {
        return executeStudentTool('read_lesson', { orgId, userId, courseId, args }, async () => {
          await verifyLessonBelongsToCourse(args.lessonId, courseId);
          const lesson = await getLesson(args.lessonId);
          const content = await getLessonNoteHtml(args.lessonId, 'en');

          return {
            id: lesson.id,
            title: lesson.title,
            content,
            note: lesson.note ?? null
          };
        });
      }
    }),

    read_lesson_transcript: tool({
      description:
        "Read the transcript of a lesson's video(s). A video's spoken content is NOT part of the lesson body, so use this whenever the learner asks about what the video says, explains, or demonstrates. Use this for uploaded videos and YouTube embeds. Note: YouTube transcripts require a paid plan.",
      inputSchema: readLessonParam,
      execute: async (args) => {
        return executeStudentTool('read_lesson_transcript', { orgId, userId, courseId, args }, async () => {
          await verifyLessonBelongsToCourse(args.lessonId, courseId);

          return getLessonVideoTranscript(args.lessonId, orgId, { userId, courseId });
        });
      }
    }),

    read_exercise: tool({
      description:
        'Read an exercise prompt — the question text and options visible to a student. Answer keys, correct flags, and marking schemes are stripped before returning.',
      inputSchema: readExerciseParam,
      execute: async (args) => {
        return executeStudentTool('read_exercise', { orgId, userId, courseId, args }, async () => {
          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);
          const exercise = await getExercise(args.exerciseId);

          const questions = (exercise.questions ?? []).map((q) =>
            stripAnswerKeysFromQuestion({
              id: q.id,
              title: q.title,
              questionTypeId: q.questionTypeId,
              order: q.order,
              points: q.points ?? null,
              options: q.options ?? []
            })
          );

          return {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description,
            questions
          };
        });
      }
    }),

    read_my_submissions: tool({
      description:
        "Read this learner's own submitted result for an exercise. Use this before answering questions such as 'what did I miss?', 'what was my score?', or 'what feedback did I get?'. Returns the latest attempt unless an attempt number is supplied. It never returns answer keys or another learner's data.",
      inputSchema: readMySubmissionsParam,
      execute: async (args) => {
        return executeStudentTool('read_my_submissions', { orgId, userId, courseId, args }, async () => {
          return getStudentSubmissionReview({
            courseId,
            profileId: userId,
            exerciseId: args.exerciseId,
            attempt: args.attempt
          });
        });
      }
    }),

    read_my_skill_mastery: tool({
      description:
        "Read this learner's own mastery of each skill or standard tagged in this course: a level (not started, learning, proficient, mastered), a score from 0 to 100 and how many attempts it rests on. Use it when they ask what to practise or how they are doing on a topic. Never returns another learner's data.",
      inputSchema: readMySkillMasteryParam,
      execute: async () => {
        return executeStudentTool('read_my_skill_mastery', { orgId, userId, courseId }, async () => {
          return { skills: await getStudentSkillMastery(courseId, userId) };
        });
      }
    }),

    read_current_attempt: tool({
      description:
        'Read the question the learner is working on right now and what they have typed so far (unsubmitted). Call this first when they ask for help with or a check of their current exercise question. Never returns the answer key.',
      inputSchema: emptyParam,
      execute: async () => {
        return executeStudentTool('read_current_attempt', { orgId, userId, courseId }, async () => {
          const attempt = await loadCurrentAttempt();
          if (!attempt) return noAttempt;

          const { question, input, exerciseTitle } = attempt;
          const typeName = getQuestionTypeById(question.questionTypeId)?.typename ?? null;

          return {
            available: true as const,
            exerciseTitle,
            question: {
              id: question.id,
              question: question.title,
              type: typeName,
              points: question.points,
              options: (question.options ?? []).filter((option) => option.label != null).map((option) => option.label)
            },
            currentInput: input,
            assessmentMode: mode,
            guidance: isHelpBlocked(mode)
              ? BLOCKED_GUIDANCE
              : 'Use check_math_answer for "is this right?" and check_math_step for working. Never reveal the answer key.'
          };
        });
      }
    }),

    check_math_answer: tool({
      description:
        'Grade the learner\'s current, unsubmitted input with the math engine and answer "is this right?". Returns whether it is correct, the reason, and any known slip it matches. Never returns the answer key.',
      inputSchema: emptyParam,
      execute: async () => {
        return executeStudentTool('check_math_answer', { orgId, userId, courseId }, async () => {
          if (isHelpBlocked(mode)) return blocked;

          const attempt = await loadCurrentAttempt();
          if (!attempt) return noAttempt;

          const verdict = gradeCurrentInput(attempt.question, attempt.input);
          const guidance = answerGuidance(mode, verdict);
          if (verdict.status === 'unavailable') return { available: true as const, checked: false as const, guidance };

          return {
            available: true as const,
            checked: true as const,
            isCorrect: verdict.isCorrect,
            reason: verdict.reason,
            misconceptionHint: verdict.misconception ? describeMisconception(verdict.misconception) : undefined,
            teacherFeedback: verdict.teacherFeedback,
            guidance
          };
        });
      }
    }),

    check_math_step: tool({
      description:
        "Check the learner's working line by line with the math engine. Each line is compared with the line before it; the result names the first line that does not follow. Omit lines to check the working in the learner's current attempt; pass startingExpression (LaTeX from the question) to check the first line against the problem.",
      inputSchema: checkMathStepParam,
      execute: async (args) => {
        return executeStudentTool('check_math_step', { orgId, userId, courseId, args }, async () => {
          if (isHelpBlocked(mode)) return blocked;

          const attempt = args.lines ? null : await loadCurrentAttempt();
          const currentLines = [...(attempt?.input.working?.lines ?? []), attempt?.input.latex ?? ''].filter((line) =>
            line.trim()
          );
          const lines = args.lines ?? currentLines;
          if (lines.length === 0) return noAttempt;

          const { steps, firstIncorrectIndex } = checkMathSteps(lines, { startingExpression: args.startingExpression });

          return {
            available: true as const,
            steps: steps.map((step, index) => ({ line: index + 1, latex: step.latex, status: step.status })),
            firstIncorrectLine: firstIncorrectIndex === null ? null : firstIncorrectIndex + 1,
            guidance: stepsGuidance(mode, firstIncorrectIndex)
          };
        });
      }
    }),

    compare_math_expressions: tool({
      description:
        'Ask the math engine whether two expressions or equations (LaTeX without $ delimiters) are equivalent. Returns equal, different, disputed or invalid.',
      inputSchema: compareMathExpressionsParam,
      execute: async (args) => {
        return executeStudentTool('compare_math_expressions', { orgId, userId, courseId, args }, async () => {
          if (isHelpBlocked(mode)) return blocked;

          return { verdict: compareMathExpressions(args.left, args.right) };
        });
      }
    }),

    search_course: tool({
      description:
        'Search this course for lessons and exercises whose title or body contains the query. Returns up to `limit` ranked snippets with ids you can pass to read_lesson / read_exercise.',
      inputSchema: searchCourseParam,
      execute: async (args) => {
        return executeStudentTool('search_course', { orgId, userId, courseId, args }, async () => {
          const pattern = `%${args.query}%`;
          const limit = args.limit ?? 8;
          const noteContent = sql<string | null>`(
            SELECT string_agg(bl.content, E'\n' ORDER BY bp.position COLLATE "C")
            FROM block_placement bp
            JOIN block b ON b.id = bp.block_id AND b.type = 'note'
            JOIN block_locale bl ON bl.block_id = b.id AND bl.locale = 'en'
            WHERE bp.lesson_id = "lesson"."id"
          )`;

          const [lessonMatches, exerciseMatches] = await Promise.all([
            db
              .select({
                id: schema.lesson.id,
                title: schema.lesson.title,
                content: noteContent
              })
              .from(schema.lesson)
              .where(
                and(
                  eq(schema.lesson.courseId, courseId),
                  or(ilike(schema.lesson.title, pattern), ilike(noteContent, pattern))
                )
              )
              .limit(limit),
            db
              .select({
                id: schema.exercise.id,
                title: schema.exercise.title,
                description: schema.exercise.description
              })
              .from(schema.exercise)
              .where(
                and(
                  eq(schema.exercise.courseId, courseId),
                  or(ilike(schema.exercise.title, pattern), ilike(schema.exercise.description, pattern))
                )
              )
              .limit(limit)
          ]);

          const lessonsResult = lessonMatches.map((lm) => ({
            type: 'lesson' as const,
            id: lm.id,
            title: lm.title,
            snippet: makeSnippet(lm.content ?? lm.title ?? '', args.query)
          }));

          const exercisesResult = exerciseMatches.map((em) => ({
            type: 'exercise' as const,
            id: em.id,
            title: em.title,
            snippet: makeSnippet(em.description ?? em.title ?? '', args.query)
          }));

          const merged = [...lessonsResult, ...exercisesResult].slice(0, limit);

          return { query: args.query, results: merged };
        });
      }
    })
  };
}

export type StudentAgentTools = ReturnType<typeof buildStudentAgentTools>;
