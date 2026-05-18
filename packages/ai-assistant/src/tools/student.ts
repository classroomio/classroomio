import { z } from 'zod';

/**
 * Student tool schemas — read-only, course-scoped.
 *
 * The student agent uses these to ground answers in this course's content.
 * Every server-side implementation MUST verify the lesson/exercise belongs to
 * the current course and never reveal answer keys or solutions.
 */

export const listCourseOutlineSchema = {
  description:
    'List the current course outline: sections with their lessons and exercises (titles + ids only, no content). Use this first to understand what is available before reading a specific lesson or exercise.',
  parameters: z.object({
    courseId: z.string().describe('The current course ID. Must match the active course context.')
  })
};

export const readLessonSchema = {
  description:
    'Read the rendered text of a lesson in the current course. Use this when the learner refers to a lesson that is not currently open, or when answering a question requires content from a specific lesson. Returns lesson title plus body text (no answer keys).',
  parameters: z.object({
    courseId: z.string().describe('The current course ID'),
    lessonId: z.string().describe('The lesson ID. Must belong to this course.')
  })
};

export const readExerciseSchema = {
  description:
    'Read an exercise prompt — the question text and instructions visible to a student. NEVER returns correct answers, marking schemes, or solutions. Use this to understand what the learner is being asked.',
  parameters: z.object({
    courseId: z.string().describe('The current course ID'),
    exerciseId: z.string().describe('The exercise ID. Must belong to this course.')
  })
};

export const searchCourseSchema = {
  description:
    'Search this course for lessons and exercises whose title or body matches a free-text query. Returns ranked snippets with lesson or exercise ids so you can follow up with read_lesson / read_exercise. Use this when the learner asks "where did we cover X?" or refers to material by topic instead of by title.',
  parameters: z.object({
    courseId: z.string().describe('The current course ID'),
    query: z.string().min(1).max(200).describe('Free-text query — keywords or a short phrase.'),
    limit: z.number().int().min(1).max(20).default(8).describe('Maximum number of results to return.')
  })
};
