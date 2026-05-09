import { z } from 'zod';
import { CoursePlanSchema } from '@cio/ai-assistant';
import { ZExerciseSectionAfterBehavior } from '@cio/utils/validation/exercise';
import { ZCourseLandingPageUpdate, ZCourseLandingPageMetadataUpdate } from '@cio/utils/validation/course';

// courseId is NOT a parameter — it's injected from the authenticated request context.
// This prevents prompt injection from tricking the LLM into targeting another course.

export const emptyParam = z.object({});
export const lessonReadParam = z.object({ lessonId: z.string(), locale: z.string().default('en') });
export const exerciseReadParam = z.object({ exerciseId: z.string() });
export const createSectionParam = z.object({ title: z.string().min(1), order: z.number().int().min(0) });
export const updateSectionParam = z
  .object({
    sectionId: z.string(),
    title: z.string().min(1).optional(),
    order: z.number().int().min(0).optional()
  })
  .refine((data) => data.title !== undefined || data.order !== undefined, {
    message: 'Provide at least one field to update'
  });
export const createLessonParam = z.object({
  sectionId: z.string(),
  title: z.string().min(1),
  order: z.number().int().min(0)
});
export const updateLessonParam = z
  .object({
    lessonId: z.string(),
    title: z.string().min(1).optional(),
    sectionId: z.string().optional(),
    order: z.number().int().min(0).optional(),
    lessonAt: z.string().optional(),
    callUrl: z.string().optional(),
    isUnlocked: z.boolean().optional(),
    public: z.boolean().optional()
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
  );
export const updateContentParam = z.object({
  lessonId: z.string(),
  locale: z.string().default('en'),
  content: z.string().min(1)
});

export const questionSchema = z.object({
  question: z.string().min(1),
  questionTypeId: z.number().int().min(1).max(14).default(1),
  points: z.number().min(0).default(1),
  order: z.number().int().min(0),
  options: z.array(z.object({ label: z.string().min(1), isCorrect: z.boolean() }))
});

export const createExerciseParam = z.object({
  lessonId: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional().describe('Optional short description shown to students above the questions.'),
  order: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      'Display order within the section (0-based). Required when sectionId is provided. Lessons and exercises share the same order space within a section.'
    ),
  questions: z.array(questionSchema)
});

export const updateExerciseParam = z
  .object({
    exerciseId: z.string().describe('The exercise to update. Must be a real UUID returned by a prior tool call.'),
    title: z.string().min(1).optional().describe('New exercise title. Omit to keep unchanged.'),
    description: z
      .string()
      .optional()
      .describe('New short description shown to students. Pass an empty string to clear it.'),
    lessonId: z.string().optional().describe('Link the exercise to a lesson in this course.'),
    sectionId: z.string().optional().describe('Move the exercise to a section in this course.'),
    order: z.number().int().min(0).optional().describe('New order within the section (0-based).'),
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
  );

export const updateExerciseSectionParam = z
  .object({
    exerciseId: z
      .string()
      .describe('The exercise that contains this section. Must match the exercise you read with get_exercise_details.'),
    exerciseSectionId: z
      .string()
      .describe('The exercise section id from get_exercise_details `sections[].id` — not a course section id.'),
    title: z.string().min(1).optional().describe('New section heading shown above questions in this block.'),
    description: z.string().optional().describe('Optional intro HTML for this block. Pass an empty string to clear it.')
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: 'Provide at least title or description to update'
  });

export const createExerciseSectionParam = z.object({
  exerciseId: z.string().describe('The exercise that will contain this section.'),
  title: z.string().min(1).describe('Section heading shown above the questions in this block.'),
  description: z
    .string()
    .optional()
    .describe('Optional intro HTML for this block. Pass an empty string to leave it blank.'),
  order: z.number().int().min(0).describe('Display order within the exercise (0-based).'),
  colorTheme: z.enum(['blue', 'green', 'amber', 'rose', 'violet', 'slate']).optional(),
  afterBehavior: ZExerciseSectionAfterBehavior.optional()
});

export const addQuestionsParam = z.object({
  exerciseId: z.string(),
  exerciseSectionId: z
    .string()
    .uuid()
    .optional()
    .describe(
      'In-exercise section id from get_exercise_details `sections[].id` where the new questions should appear (not a course outline section id).'
    ),
  questions: z.array(questionSchema)
});

export const updateOptionSchema = z.object({
  id: z.number().int().optional(),
  label: z.string().min(1).optional(),
  isCorrect: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional()
});

export const updateQuestionPatchSchema = z.object({
  id: z.number().int(),
  question: z.string().min(1).optional(),
  questionTypeId: z.number().int().min(1).max(14).optional(),
  points: z.number().min(0).optional(),
  order: z.number().int().min(0).optional(),
  exerciseSectionId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe(
      'Move the question to this in-exercise block (get_exercise_details sections[].id). Use null to clear section assignment.'
    ),
  settings: z.record(z.string(), z.unknown()).optional(),
  options: z.array(updateOptionSchema).optional()
});

export const updateQuestionsParam = z.object({
  exerciseId: z.string(),
  questions: z.array(updateQuestionPatchSchema).min(1)
});
export const coursePlanParam = z.object({ plan: CoursePlanSchema });

// Gemini's tool-schema validator only accepts string enums, so numeric/boolean
// `z.literal` values must be relaxed to plain types in the schemas the model sees.
export const agentLessonTabsOrder = z.array(
  z.object({
    id: z.number().int().min(1).max(4),
    name: z.string()
  })
);
export const agentLandingPageMetadataUpdate = ZCourseLandingPageMetadataUpdate.extend({
  lessonTabsOrder: agentLessonTabsOrder.optional()
});
export const updateCourseLandingPageParam = ZCourseLandingPageUpdate.extend({
  metadata: agentLandingPageMetadataUpdate.optional()
}).refine(
  (data) =>
    data.title !== undefined ||
    data.description !== undefined ||
    data.overview !== undefined ||
    data.cost !== undefined ||
    data.currency !== undefined ||
    data.imageUrl !== undefined ||
    data.generateImage !== undefined ||
    data.imageQuery !== undefined ||
    data.metadata !== undefined,
  {
    message: 'Provide at least one landing-page field to update'
  }
);
export const goLiveParam = z.object({
  confirmPublish: z
    .boolean()
    .describe('Must be true. Only use this after the teacher explicitly asks to publish or go live.')
});

export const reorderContentParam = z.object({
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0)
      })
    )
    .optional()
    .describe('Reorder sections by setting new order values'),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(['LESSON', 'EXERCISE']),
        order: z.number().int().min(0).optional().describe('New order within the section'),
        sectionId: z.string().nullable().optional().describe('Move item to a different section')
      })
    )
    .optional()
    .describe('Reorder or move lessons/exercises')
});
