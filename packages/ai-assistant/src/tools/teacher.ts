import { z } from 'zod';
import { QUESTION_TYPE_REGISTRY } from '@cio/question-types';
import { CoursePlanSchema } from '../types';
import { CourseTemplateIdSchema, TemplateFormFieldSchema } from '../templates';
import {
  LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT,
  LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT,
  LANDING_PAGE_SECTION_HTML_AGENT_HINT
} from './landing-page-html-hint';

const QUESTION_TYPE_ID_DESCRIPTION = QUESTION_TYPE_REGISTRY.map((t) => `${t.id}=${t.typename} (${t.label})`).join(', ');

/**
 * Mutation tool schemas available only to teachers.
 */

export const createSectionSchema = {
  description:
    'Create a new section in the course. Sections group lessons together. Use this when building a course structure from a plan.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    title: z.string().min(1).describe('Section title'),
    order: z.number().int().min(0).describe('Display order (0-based). Set after existing sections when appending.')
  })
};

const exerciseSectionAfterBehaviorSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('continue') }),
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('go_to_section'), exerciseSectionId: z.string().uuid() })
]);

export const updateSectionSchema = {
  description:
    'Update metadata for an existing section in the course. Use this to rename a section or change its display order instead of creating a new section.',
  parameters: z
    .object({
      courseId: z.string().describe('The course ID'),
      sectionId: z.string().describe('The section ID to update'),
      title: z.string().min(1).optional().describe('New section title'),
      order: z.number().int().min(0).optional().describe('New section display order (0-based)')
    })
    .refine((data) => data.title !== undefined || data.order !== undefined, {
      message: 'Provide at least one field to update'
    })
};

export const createLessonSchema = {
  description:
    'Create a new lesson within a section. The lesson is created with a title but no content — use update_lesson_content to add content after creation.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    sectionId: z.string().describe('The section ID to place the lesson in'),
    title: z.string().min(1).describe('Lesson title'),
    order: z
      .number()
      .int()
      .min(0)
      .describe(
        'Display order within the section (0-based). Lessons and exercises share the SAME order space within a section, so increment by 1 across both. Example: lesson1=0, lesson2=1, exercise=2.'
      )
  })
};

export const updateLessonSchema = {
  description:
    'Update metadata for an existing lesson in the course. Use this to rename, move, reorder, schedule, or change visibility/unlock settings for a lesson instead of creating a new lesson.',
  parameters: z
    .object({
      courseId: z.string().describe('The course ID'),
      lessonId: z.string().describe('The lesson ID to update'),
      title: z.string().min(1).optional().describe('New lesson title'),
      sectionId: z.string().optional().describe('Move the lesson into a different section'),
      order: z.number().int().min(0).optional().describe('New order within the section (0-based)'),
      lessonAt: z.string().optional().describe('Scheduled lesson datetime'),
      callUrl: z.string().optional().describe('Optional live session URL'),
      isUnlocked: z.boolean().optional().describe('Whether the lesson is unlocked for students'),
      public: z.boolean().optional().describe('Whether the lesson is public')
    })
    .refine(
      (data) =>
        data.title !== undefined ||
        data.sectionId !== undefined ||
        data.order !== undefined ||
        data.lessonAt !== undefined ||
        data.callUrl !== undefined ||
        data.isUnlocked !== undefined ||
        data.public !== undefined,
      {
        message: 'Provide at least one field to update'
      }
    )
};

export const updateLessonContentSchema = {
  description:
    'Update the text content of a lesson. Replaces the full lesson HTML for the given locale. When modifying only part of a lesson, always preserve all existing content and only change the specific section requested.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    lessonId: z.string().describe('The lesson ID to update'),
    locale: z.string().default('en').describe('The locale to write content in'),
    content: z
      .string()
      .min(1)
      .describe(
        'The full lesson HTML content. Use only: h2, h3, p, ul, ol, li, strong, em, blockquote, code, pre, a. Never use div, span, table, img, iframe, script, or style.'
      )
  })
};

export const createExerciseSchema = {
  description:
    'Create a new exercise with questions and answer options. Each question can be multiple choice (RADIO), multiple select (CHECKBOX), true/false, or other types. Quality bar: aim for 6-10 questions covering the full lesson, mixing recall, applied, and scenario-based questions; RADIO and CHECKBOX questions must have at least 4 plausible options.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    lessonId: z.string().optional().describe('Optional lesson ID to link the exercise to'),
    sectionId: z.string().optional().describe('Optional section ID'),
    title: z.string().min(1).describe('Exercise title'),
    description: z.string().optional().describe('Optional short description shown to students above the questions.'),
    order: z
      .number()
      .int()
      .min(0)
      .describe(
        'Display order within the section (0-based). REQUIRED whenever sectionId is provided. Lessons and exercises share the SAME order space within a section, so an end-of-section quiz must have a higher order than every lesson in that section. Example: lesson1=0, lesson2=1, end-of-section exercise=2.'
      ),
    questions: z
      .array(
        z.object({
          question: z.string().min(1).describe('The question text'),
          questionTypeId: z
            .number()
            .int()
            .min(1)
            .max(QUESTION_TYPE_REGISTRY.length)
            .describe(
              `Required on every question — never omit. Supported types: ${QUESTION_TYPE_ID_DESCRIPTION}. Vary types across questions (do not default everything to RADIO/1).`
            ),
          points: z.number().min(0).default(1).describe('Points for this question'),
          order: z.number().int().min(0).describe('Display order'),
          options: z
            .array(
              z.object({
                label: z.string().min(1).describe('Option text'),
                isCorrect: z.boolean().describe('Whether this is a correct answer')
              })
            )
            .describe(
              'Answer options. RADIO and CHECKBOX questions MUST have at least 4 options with plausible distractors (not obvious filler). RADIO needs exactly one correct option; CHECKBOX needs at least 2 correct and at least 1 incorrect. TRUE_FALSE uses exactly 2 options. Leave empty for NUMERIC/STAR/WORD_BANK.'
            )
        })
      )
      .min(1)
      .describe(
        'Aim for 6-10 questions per exercise when assessing a full lesson. Spread across all sub-topics, mix difficulty, and vary question types.'
      )
  })
};

export const createExerciseSectionSchema = {
  description:
    'Create a new section inside an existing exercise. Use this to add a new question block before adding questions into it.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    exerciseId: z.string().describe('The exercise that will contain this section'),
    title: z.string().min(1).describe('Section heading shown above questions in this block'),
    description: z.string().optional().describe('Optional intro HTML for this block'),
    order: z.number().int().min(0).describe('Display order within the exercise (0-based)'),
    colorTheme: z.enum(['blue', 'green', 'amber', 'rose', 'violet', 'slate']).optional(),
    afterBehavior: exerciseSectionAfterBehaviorSchema.optional()
  })
};

export const updateExerciseSectionSchema = {
  description:
    'Update the title and/or description of one question block inside an exercise (from get_exercise_details sections). Not the same as update_section (course outline).',
  parameters: z
    .object({
      courseId: z.string().describe('The course ID'),
      exerciseId: z.string().describe('The exercise containing this block'),
      exerciseSectionId: z.string().describe('Section id from get_exercise_details sections[].id'),
      title: z.string().min(1).optional().describe('Heading shown above questions in this block'),
      description: z.string().optional().describe('Optional intro HTML for this block; empty string clears it')
    })
    .refine((data) => data.title !== undefined || data.description !== undefined, {
      message: 'Provide at least title or description'
    })
};

export const updateExerciseSchema = {
  description:
    "Update an existing exercise's metadata (title, description, linked lesson, section, order, due date, lock state, allow-multiple-attempts). Use this to edit the exercise itself — not its questions. To change questions, use update_questions; to add questions, use add_questions.",
  parameters: z
    .object({
      courseId: z.string().describe('The course ID'),
      exerciseId: z.string().describe('The exercise to update. Must be a real UUID returned by a prior tool call.'),
      title: z.string().min(1).optional().describe('New exercise title. Omit to keep unchanged.'),
      description: z
        .string()
        .optional()
        .describe('New short description shown to students. Pass an empty string to clear it.'),
      lessonId: z.string().optional().describe('Link the exercise to a lesson in this course'),
      sectionId: z.string().optional().describe('Place the exercise in a section in this course'),
      order: z.number().int().min(0).optional().describe('New order within the section (0-based)'),
      dueBy: z
        .string()
        .optional()
        .describe('Due date in ISO 8601 format (e.g. 2026-05-01T23:59:00Z). Omit to keep unchanged.'),
      isUnlocked: z.boolean().optional().describe('Whether the exercise is unlocked for students.'),
      allowMultipleAttempts: z.boolean().optional().describe('Whether students can re-take the exercise.')
    })
    .refine(
      (data) =>
        data.title !== undefined ||
        data.description !== undefined ||
        data.lessonId !== undefined ||
        data.sectionId !== undefined ||
        data.order !== undefined ||
        data.dueBy !== undefined ||
        data.isUnlocked !== undefined ||
        data.allowMultipleAttempts !== undefined,
      {
        message: 'Provide at least one field to update'
      }
    )
};

export const addQuestionsSchema = {
  description:
    'Add questions to an existing exercise. Use this when the exercise already exists and you want to add more questions. When get_exercise_details returns a non-empty sections array, pass exerciseSectionId so new questions are placed in the right in-exercise block (same ids as update_exercise_section).',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    exerciseId: z.string().describe('The existing exercise ID'),
    exerciseSectionId: z
      .string()
      .uuid()
      .optional()
      .describe(
        'In-exercise section id from get_exercise_details `sections[].id` (not a course outline section id). Use when the exercise has question blocks/sections; omit only when questions are not grouped into sections.'
      ),
    questions: z.array(
      z.object({
        question: z.string().min(1).describe('The question text'),
        questionTypeId: z
          .number()
          .int()
          .min(1)
          .max(QUESTION_TYPE_REGISTRY.length)
          .describe(
            `Required on every question — never omit. Supported types: ${QUESTION_TYPE_ID_DESCRIPTION}. Vary types across questions (do not default everything to RADIO/1).`
          ),
        points: z.number().min(0).default(1).describe('Points for this question'),
        order: z.number().int().min(0).describe('Display order'),
        options: z.array(
          z.object({
            label: z.string().min(1).describe('Option text'),
            isCorrect: z.boolean().describe('Whether this is a correct answer')
          })
        )
      })
    )
  })
};

export const updateQuestionsSchema = {
  description:
    'Update existing questions in an exercise. Pass only the fields you want to change; `id` identifies the question. Optional `exerciseSectionId` (from get_exercise_details sections) moves the question to another in-exercise block; use null to clear section assignment. For NUMERIC the correct answer is `settings.correctValue` (a number), not an option — do NOT add options to NUMERIC questions. For STAR use `settings.correctValue` (1..max). For WORD_BANK use `settings.correctAnswers` and `settings.template`. RADIO/CHECKBOX/TRUE_FALSE use `options[].isCorrect`: include an option `id` to edit it, omit `id` to add a new one. `settings` is shallow-merged with the existing settings. Omit `options` entirely to leave existing options unchanged — if you pass an options array, any existing option not listed in it will be removed.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    exerciseId: z.string().describe('The existing exercise ID'),
    questions: z.array(
      z.object({
        id: z.number().int().describe('Existing question id. Required.'),
        question: z.string().min(1).optional().describe('New question text. Omit to keep unchanged.'),
        questionTypeId: z
          .number()
          .int()
          .min(1)
          .max(QUESTION_TYPE_REGISTRY.length)
          .optional()
          .describe(`Question type ID. Supported types: ${QUESTION_TYPE_ID_DESCRIPTION}`),
        points: z.number().min(0).optional(),
        order: z.number().int().min(0).optional(),
        exerciseSectionId: z
          .string()
          .uuid()
          .nullable()
          .optional()
          .describe(
            'In-exercise section id from get_exercise_details (not course outline). Omit to leave unchanged; pass null to unassign from a section.'
          ),
        settings: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Per-type correct-answer storage. NUMERIC: { correctValue: number, tolerance?: number }. STAR: { correctValue: number }. WORD_BANK: { correctAnswers: string[], template: string }. Shallow-merged with existing settings.'
          ),
        options: z
          .array(
            z.object({
              id: z
                .number()
                .int()
                .optional()
                .describe('Include to update an existing option; omit to create a new one.'),
              label: z.string().min(1).optional(),
              isCorrect: z.boolean().optional(),
              settings: z.record(z.string(), z.unknown()).optional()
            })
          )
          .optional()
      })
    )
  })
};

export const updateCourseLandingPageSchema = {
  description:
    'Update public course landing-page fields. The top-level course description is plain text (no HTML). The metadata description field is the Description block after Requirements and must be HTML, along with overview, goals, requirements, and instructor bio—paragraphs and bold/italic only, never h1–h6. Title is plain text.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    title: z.string().min(1).optional().describe('Plain-text public course title (no HTML)'),
    description: z.string().min(1).optional().describe(LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT),
    overview: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
    cost: z.number().int().min(0).optional().describe('Course price in the selected currency'),
    currency: z.enum(['NGN', 'USD']).optional().describe('Course price currency'),
    imageUrl: z.string().url().optional().describe('Banner image URL to use directly'),
    generateImage: z.boolean().optional().describe('Whether to generate/select a banner image from the image query'),
    imageQuery: z.string().min(1).max(120).optional().describe('Search query for a generated/selected banner image'),
    metadata: z
      .object({
        requirements: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
        description: z.string().optional().describe(LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT),
        goals: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
        videoUrl: z.string().optional(),
        showDiscount: z.boolean().optional(),
        discount: z.number().optional(),
        paymentLink: z.string().optional(),
        instructor: z
          .object({
            name: z.string().optional(),
            role: z.string().optional(),
            coursesNo: z.number().optional(),
            description: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
            imgUrl: z.string().optional()
          })
          .optional()
      })
      .optional()
      .describe('Landing-page metadata fields')
  })
};

export const checkCourseGoLiveReadinessSchema = {
  description:
    'Check whether a course is ready to publish. Returns blockers, warnings, suggested fixes, and a public course URL when available. Does not publish the course.',
  parameters: z.object({
    courseId: z.string().describe('The course ID')
  })
};

export const goLiveCourseSchema = {
  description:
    'Publish the course after the teacher explicitly asks to go live. Runs readiness checks first and fails with blockers if required fields or content are missing.',
  parameters: z.object({
    courseId: z.string().describe('The course ID'),
    confirmPublish: z.literal(true).describe('Must be true after explicit teacher confirmation to publish')
  })
};

export const generateCoursePlanSchema = {
  description:
    'Generate a structured course plan with sections and lessons based on a topic or uploaded document. Returns a JSON plan that the teacher can review and approve before any content is created. Always use this tool when the teacher asks you to design, structure, or plan a course. The LAST section MUST be the comprehensive final examination (see plan schema): at least one exercise item that will cover every prior course section with multiple in-exercise question blocks and 3–5 questions per prior section.',
  parameters: z.object({
    plan: CoursePlanSchema.describe(
      'The proposed course structure. Instructional content lives in prior sections; the final section is always the course final examination (see schema). Each lesson includes a short description and whether it should have a linked exercise.'
    )
  })
};

export const askTemplateQuestionsSchema = {
  description:
    'Render a structured questionnaire card to the teacher for a template flow. Pause until the teacher submits answers via a user message with metadata.template.action="submit_template_answers" or skips via metadata.template.action="skip_template_form".',
  parameters: z.object({
    templateId: CourseTemplateIdSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    fields: z.array(TemplateFormFieldSchema).min(1)
  })
};

export const fetchDocumentationUrlSchema = {
  description:
    'Fetch a public documentation URL via Jina Reader and return cleaned markdown plus a list of same-origin sub-page links. Use this iteratively when the teacher provided a documentation URL: start with the root, then call again with the most relevant 5–15 sub-pages until you have enough product context.',
  parameters: z.object({
    url: z.string().url()
  })
};
