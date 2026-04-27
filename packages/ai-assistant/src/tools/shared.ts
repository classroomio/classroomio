import { z } from 'zod';

/**
 * Read-only tool schemas available to both teacher and student roles.
 */

export const getCourseStructureSchema = {
  description:
    'Get the full course structure including sections, lessons, and exercises as a tree. Use this to understand what content already exists before creating new content.',
  parameters: z.object({
    courseId: z.string().describe('The course ID')
  })
};

export const getLessonContentSchema = {
  description:
    'Get the HTML content of a specific lesson. Use this to read existing lesson text before updating it or to understand the writing style.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    lessonId: z.string().describe('The lesson ID to read'),
    locale: z.string().default('en').describe('The locale to read content in')
  })
};

export const getExerciseDetailsSchema = {
  description:
    'Get an exercise with all its questions and answer options. Use this to understand existing questions before adding new ones.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    exerciseId: z.string().describe('The exercise ID to read')
  })
};
