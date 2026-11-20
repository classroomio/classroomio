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

export const readMySubmissionsSchema = {
  description:
    "Read the current learner's own submission result for an exercise, including grading status, score, missed questions, submitted answers, and instructor feedback. Never returns answer keys or another learner's data.",
  parameters: z.object({
    courseId: z.string().describe('The current course ID'),
    exerciseId: z.string().describe('The exercise ID. Must belong to this course.'),
    attempt: z.number().int().min(1).optional().describe('One-based attempt number. Defaults to the latest attempt.')
  })
};

export const readCurrentAttemptSchema = {
  description:
    "Read the question the learner is working on right now and what they have typed so far (unsubmitted). Call this first whenever the learner asks for help with, or asks you to check, their current exercise question. Returns the question text, its type, the learner's current input and working lines, and the assessment policy. NEVER returns the answer key.",
  parameters: z.object({})
};

export const checkMathStepSchema = {
  description:
    "Check a learner's working line by line with the math engine instead of doing the arithmetic yourself. Each line is compared with the line before it; the result names the first line that does not follow. Omit lines to check the working in the learner's current attempt. Pass startingExpression (LaTeX, from the question) so the first line is checked against the problem itself. Never re-derive the arithmetic yourself: report what this tool returns.",
  parameters: z.object({
    lines: z
      .array(z.string().min(1).max(500))
      .max(30)
      .optional()
      .describe("Working lines as LaTeX without $ delimiters. Omit to use the learner's current attempt."),
    startingExpression: z
      .string()
      .max(500)
      .optional()
      .describe('The expression or equation the working starts from, as LaTeX without $ delimiters.')
  })
};

export const checkMathAnswerSchema = {
  description:
    'Answer "is this right?" for the learner\'s current question. The math engine grades their current input against the answer key and returns whether it is correct, why not, and the kind of slip it matches (for example a sign error). It never returns the answer key. Use this for any "is this right?" or "can you check my answer?" request instead of judging the answer yourself.',
  parameters: z.object({})
};

export const compareMathExpressionsSchema = {
  description:
    'Ask the math engine whether two expressions or equations (LaTeX without $ delimiters) are equivalent, for example when the learner asks whether two forms are the same. Returns equal, different, disputed (the engine could not decide) or invalid (one could not be read as math).',
  parameters: z.object({
    left: z.string().min(1).max(500),
    right: z.string().min(1).max(500)
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
