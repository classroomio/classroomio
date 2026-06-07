import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';

import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import type { AiTutorSettings } from '@cio/ai-assistant';

import { getLesson } from '@cio/core/services/lesson/lesson';
import { getLessonVideoTranscript } from '@cio/core/services/agent/lesson-transcript';
import { getExercise } from '@cio/core/services/exercise/exercise';
import { listCourseSections } from '@cio/core/services/course/section';
import { AppError } from '@api/utils/errors';
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
const readLessonParam = z.object({ lessonId: z.string() });
const readExerciseParam = z.object({ exerciseId: z.string() });
const searchCourseParam = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(20).default(8)
});

export function buildStudentAgentTools(orgId: string, userId: string, courseId: string, _settings: AiTutorSettings) {
  return {
    list_course_outline: tool({
      description:
        'List the course outline (sections with their lessons and exercises). The courseId is automatically scoped — do not pass it. Returns titles and ids only.',
      inputSchema: listCourseOutlineParam,
      execute: async () => {
        return executeStudentTool('list_course_outline', { orgId, userId, courseId }, async () => {
          const [sections, lessons, exercises] = await Promise.all([
            listCourseSections(courseId),
            db
              .select({
                id: schema.lesson.id,
                title: schema.lesson.title,
                sectionId: schema.lesson.sectionId,
                order: schema.lesson.order
              })
              .from(schema.lesson)
              .where(eq(schema.lesson.courseId, courseId))
              .orderBy(asc(schema.lesson.order)),
            db
              .select({
                id: schema.exercise.id,
                title: schema.exercise.title,
                lessonId: schema.exercise.lessonId,
                sectionId: schema.exercise.sectionId,
                order: schema.exercise.order
              })
              .from(schema.exercise)
              .where(eq(schema.exercise.courseId, courseId))
              .orderBy(asc(schema.exercise.order))
          ]);

          return { sections, lessons, exercises };
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
        "Read the transcript of a lesson's uploaded video(s). A video's spoken content is NOT part of the lesson body, so use this whenever the learner asks about what the video says, explains, or demonstrates. Only uploaded videos are transcribed — embedded links (YouTube, etc.) return no transcript.",
      inputSchema: readLessonParam,
      execute: async (args) => {
        return executeStudentTool('read_lesson_transcript', { orgId, userId, courseId, args }, async () => {
          await verifyLessonBelongsToCourse(args.lessonId, courseId);

          return getLessonVideoTranscript(args.lessonId, orgId);
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

    search_course: tool({
      description:
        'Search this course for lessons and exercises whose title or body contains the query. Returns up to `limit` ranked snippets with ids you can pass to read_lesson / read_exercise.',
      inputSchema: searchCourseParam,
      execute: async (args) => {
        return executeStudentTool('search_course', { orgId, userId, courseId, args }, async () => {
          const pattern = `%${args.query}%`;
          const limit = args.limit ?? 8;

          const [lessonMatches, exerciseMatches] = await Promise.all([
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
