import { and, eq, ilike, or } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';

import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import type { AiTutorSettings } from '@cio/ai-assistant';
import { ContentType } from '@cio/utils/constants';

import { getLesson } from '@cio/core/services/lesson/lesson';
import { getLessonVideoTranscript } from '@cio/core/services/agent/lesson-transcript';
import { getExercise } from '@cio/core/services/exercise/exercise';
import { getCourseOutlineSummary } from '@cio/core/services/course/outline';
import { getStudentSubmissionReview } from '@api/services/submission/student-submission';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { AppError } from '@api/utils/errors';
import { AgentEvent, trackAgentEvent } from '@cio/core/utils/tinybird';
import {
  verifyActivityBelongsToCourse,
  verifyExerciseBelongsToCourse,
  verifyLessonBelongsToCourse
} from '@cio/core/services/agent/chat-context';

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
const readLessonParam = z.object({ lessonId: z.string() });
const readExerciseParam = z.object({ exerciseId: z.string() });
const readMySubmissionsParam = z.object({
  exerciseId: z.string(),
  attempt: z.number().int().min(1).optional()
});
const searchCourseParam = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(20).default(8)
});

/** Builds the read-only student tools scoped to one course and learner. */
export function buildStudentAgentTools(orgId: string, userId: string, courseId: string, _settings: AiTutorSettings) {
  return {
    list_course_outline: tool({
      description:
        'List the course outline in course order: sections with their lessons, exercises and activities, and lessons, exercises or activities outside any section in their place. The courseId is automatically scoped — do not pass it. Returns titles and ids only.',
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
          const lessonWithLangs = lesson as {
            id: string;
            title: string;
            note?: string | null;
            lessonLanguages?: Array<{ locale: string; content: string | null }>;
          };
          const content = lessonWithLangs.lessonLanguages?.find((ll) => ll.locale === 'en')?.content ?? null;

          return {
            id: lesson.id,
            title: lesson.title,
            content,
            note: lessonWithLangs.note ?? null
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

    search_course: tool({
      description:
        'Search this course for lessons, exercises and activities whose title or body contains the query. Returns up to `limit` ranked snippets with ids you can pass to read_lesson / read_exercise. Activity results are informational only; there is no read tool for activities.',
      inputSchema: searchCourseParam,
      execute: async (args) => {
        return executeStudentTool('search_course', { orgId, userId, courseId, args }, async () => {
          const pattern = `%${args.query}%`;
          const limit = args.limit ?? 8;

          const [lessonMatches, exerciseMatches, activityMatches] = await Promise.all([
            db
              .select({
                id: schema.lesson.id,
                title: schema.lesson.title,
                content: schema.lessonLanguage.content
              })
              .from(schema.lesson)
              .leftJoin(
                schema.lessonLanguage,
                and(eq(schema.lessonLanguage.lessonId, schema.lesson.id), eq(schema.lessonLanguage.locale, 'en'))
              )
              .where(
                and(
                  eq(schema.lesson.courseId, courseId),
                  or(ilike(schema.lesson.title, pattern), ilike(schema.lessonLanguage.content, pattern))
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
              .limit(limit),
            db
              .select({
                id: schema.courseActivity.id,
                title: schema.courseActivity.title,
                instructions: schema.courseActivity.instructions
              })
              .from(schema.courseActivity)
              .where(
                and(
                  eq(schema.courseActivity.courseId, courseId),
                  or(ilike(schema.courseActivity.title, pattern), ilike(schema.courseActivity.instructions, pattern))
                )
              )
              .limit(limit)
          ]);

          const accessibleActivityMatches: typeof activityMatches = [];
          for (const activityMatch of activityMatches) {
            try {
              await assertEnrolledStudentContentAccess({
                courseId,
                profileId: userId,
                contentId: activityMatch.id,
                type: ContentType.Activity
              });
              accessibleActivityMatches.push(activityMatch);
            } catch {
              continue;
            }
          }

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

          const activitiesResult = accessibleActivityMatches.map((am) => ({
            type: 'activity' as const,
            id: am.id,
            title: am.title,
            snippet: makeSnippet(am.instructions ?? am.title ?? '', args.query)
          }));

          const merged = [...lessonsResult, ...exercisesResult, ...activitiesResult].slice(0, limit);

          return { query: args.query, results: merged };
        });
      }
    })
  };
}

export type StudentAgentTools = ReturnType<typeof buildStudentAgentTools>;
