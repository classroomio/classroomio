import { z } from 'zod';
import { CoursePlanSchema } from '@cio/ai-assistant';
import {
  LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT,
  LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT,
  LANDING_PAGE_SECTION_HTML_AGENT_HINT,
  BLOCK_RECIPE_TYPES
} from '@cio/ai-assistant/tools';
import {
  ADD_QUESTIONS_TOOL_DESCRIPTION,
  ENABLED_QUESTION_TYPE_REGISTRY,
  QUESTION_SETTINGS_SCHEMA_HINT,
  UPDATE_QUESTIONS_BINARY_TYPES_HINT
} from '@cio/question-types';
import { IMAGE_BLOCK_FITS, ZBlockLocale, ZBlockType } from '@cio/utils/validation/block';
import { ZExerciseSectionAfterBehavior } from '@cio/utils/validation/exercise';
import { ZCourseLandingPageUpdate, ZCourseLandingPageMetadataUpdateFields } from '@cio/utils/validation/course';

// courseId is NOT a parameter — it's injected from the authenticated request context.

// Only question types backed by a `question_type` DB row may be generated.
// Disabled types (e.g. MATCHING/HOTSPOT) have no row and would fail the FK, so
// the model is constrained to the enabled ids rather than the whole registry.
const ENABLED_QUESTION_TYPE_IDS = ENABLED_QUESTION_TYPE_REGISTRY.map((type) => type.id);
const zEnabledQuestionTypeId = z
  .number()
  .int()
  .refine((id) => ENABLED_QUESTION_TYPE_IDS.includes(id), {
    message: `questionTypeId must be one of: ${ENABLED_QUESTION_TYPE_IDS.join(', ')}`
  });
// This prevents prompt injection from tricking the LLM into targeting another course.

export const emptyParam = z.object({});
export const lessonReadParam = z.object({ lessonId: z.string(), locale: ZBlockLocale.default('en') });
export const lessonTranscriptParam = z.object({ lessonId: z.string() });
export const exerciseReadParam = z.object({ exerciseId: z.string() });
const TOP_LEVEL_ORDER_NOTE =
  'Top-level positions (1-based) are shared by sections and by lessons or exercises outside any section; the entry at that position and every later one move down one.';

export const createSectionParam = z.object({
  title: z.string().min(1),
  order: z.number().int().min(1).describe(`Position among the course's top-level entries. ${TOP_LEVEL_ORDER_NOTE}`)
});
export const updateSectionParam = z
  .object({
    sectionId: z.string(),
    title: z.string().min(1).optional(),
    order: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(`New position among the course's top-level entries. ${TOP_LEVEL_ORDER_NOTE}`)
  })
  .refine((data) => data.title !== undefined || data.order !== undefined, {
    message: 'Provide at least one field to update'
  });
export const createLessonParam = z.object({
  sectionId: z.string(),
  title: z.string().min(1),
  order: z.number().int().min(1)
});
export const attachDocumentToLessonParam = z
  .object({
    lessonId: z.string().describe('ID of the lesson to attach the document to'),
    documentId: z.string().describe('documentId of the uploaded document (from the conversation context)'),
    afterBlockId: z.uuid().optional().describe('Place the document block right after this block.'),
    beforeBlockId: z.uuid().optional().describe('Place the document block right before this block.')
  })
  .refine((data) => !(data.afterBlockId && data.beforeBlockId), {
    message: 'Provide either afterBlockId or beforeBlockId, not both'
  });
export const updateLessonParam = z
  .object({
    lessonId: z.string(),
    title: z.string().min(1).optional(),
    sectionId: z.string().optional(),
    order: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        `New order within the section (1-based). For a lesson outside any section, its top-level position. ${TOP_LEVEL_ORDER_NOTE}`
      ),
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
const zLessonBlockId = z.uuid();

export const updateContentParam = z.object({
  lessonId: z.string(),
  locale: ZBlockLocale.default('en'),
  content: z.string().min(1),
  blockId: zLessonBlockId
    .optional()
    .describe(
      'The text (note) block to write, from get_lesson_content. Required when the lesson has more than one text block. Omit only when the lesson has at most one text block.'
    )
});

export const addLessonNoteBlockParam = z
  .object({
    lessonId: z.string(),
    locale: ZBlockLocale.default('en'),
    content: z.string().min(1),
    afterBlockId: zLessonBlockId.optional().describe('Insert the new text block right after this block.'),
    beforeBlockId: zLessonBlockId.optional().describe('Insert the new text block right before this block.')
  })
  .refine((data) => !(data.afterBlockId && data.beforeBlockId), {
    message: 'Provide either afterBlockId or beforeBlockId, not both'
  });

export const removeLessonBlockParam = z.object({
  lessonId: z.string(),
  blockId: zLessonBlockId.describe('The text (note) block to remove, from get_lesson_content.')
});

export const moveLessonBlockParam = z
  .object({
    lessonId: z.string(),
    blockId: zLessonBlockId.describe('The block to move (any type), from get_lesson_content.'),
    afterBlockId: zLessonBlockId.optional().describe('Place the block right after this block.'),
    beforeBlockId: zLessonBlockId.optional().describe('Place the block right before this block.')
  })
  .refine((data) => Boolean(data.afterBlockId) !== Boolean(data.beforeBlockId), {
    message: 'Provide exactly one of afterBlockId or beforeBlockId'
  });

const blockAnchorFields = {
  afterBlockId: zLessonBlockId.optional().describe('Place the new block right after this block.'),
  beforeBlockId: zLessonBlockId.optional().describe('Place the new block right before this block.')
};
const singleAnchor = (data: { afterBlockId?: string; beforeBlockId?: string }) =>
  !(data.afterBlockId && data.beforeBlockId);
const singleAnchorMessage = { message: 'Provide either afterBlockId or beforeBlockId, not both' };

export const addLessonSlidesBlockParam = z
  .object({
    lessonId: z.string(),
    url: z.string().min(1).describe('Share link, embed link or iframe code the teacher gave for the slide deck.'),
    ...blockAnchorFields
  })
  .refine(singleAnchor, singleAnchorMessage);

export const addLessonImageBlockParam = z
  .object({
    lessonId: z.string(),
    url: z
      .url({ protocol: /^https$/ })
      .describe('https URL of the image, exactly as the teacher or a tool result gave it. Never invent one.'),
    alt: z.string().max(300).optional().describe('Short description of the image for screen readers.'),
    fit: z.enum(IMAGE_BLOCK_FITS).optional().describe('cover crops to fill the frame; contain shows the whole image.'),
    ...blockAnchorFields
  })
  .refine(singleAnchor, singleAnchorMessage);

export const updateLessonBlockSettingsParam = z.object({
  lessonId: z.string(),
  blockId: zLessonBlockId,
  changes: z
    .record(z.string(), z.unknown())
    .refine((changes) => Object.keys(changes).length > 0, { message: 'Provide at least one field to change' })
    .describe('Fields to change. image: url, alt, fit. document: name. Other block types have no editable settings.')
});

export const updateLessonBlockRequirementsParam = z
  .object({
    lessonId: z.string(),
    blockId: zLessonBlockId,
    required: z.boolean().optional().describe('Whether students must complete this block to complete the lesson.'),
    watchThreshold: z
      .number()
      .int()
      .min(1)
      .max(100)
      .nullable()
      .optional()
      .describe('Video blocks only: percent of the video a student must watch. null removes the threshold.')
  })
  .refine((data) => data.required !== undefined || data.watchThreshold !== undefined, {
    message: 'Provide required or watchThreshold'
  });

export const lessonBlockRefParam = z.object({
  lessonId: z.string(),
  blockId: zLessonBlockId
});

export const listBlockLibraryParam = z.object({
  type: ZBlockType.optional().describe('Only list blocks of this type.'),
  search: z.string().min(1).optional().describe('Text to search for.'),
  locale: ZBlockLocale.default('en')
});

export const attachLibraryBlockParam = z
  .object({
    lessonId: z.string(),
    blockId: zLessonBlockId.describe('The library block to place, from list_block_library.'),
    ...blockAnchorFields
  })
  .refine(singleAnchor, singleAnchorMessage);

export const moveBlockToLessonParam = z
  .object({
    fromLessonId: z.string(),
    toLessonId: z.string(),
    blockId: zLessonBlockId.describe('The block to move, from get_lesson_content of the source lesson.'),
    afterBlockId: zLessonBlockId.optional().describe('Place it right after this block of the target lesson.'),
    beforeBlockId: zLessonBlockId.optional().describe('Place it right before this block of the target lesson.')
  })
  .refine(singleAnchor, singleAnchorMessage);

export const getBlockRecipeParam = z.object({
  blockType: z.enum(BLOCK_RECIPE_TYPES).describe('The block type to fetch exact lesson-body markup for.')
});

export const questionSchema = z.object({
  question: z.string().min(1),
  questionTypeId: zEnabledQuestionTypeId.describe(
    'Required. Use the numeric question type IDs from the teacher system prompt (Question Types). Omitting this field is invalid — set an explicit type on every question and vary types within each exercise.'
  ),
  points: z.number().min(1).default(1),
  order: z.number().int().min(0),
  settings: z.record(z.string(), z.unknown()).optional().describe(QUESTION_SETTINGS_SCHEMA_HINT),
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
    .min(1)
    .describe(
      'Display order within the section (1-based). Required. Lessons and exercises share the same order space within a section.'
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
    order: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        `New order within the section (1-based). For an exercise outside any section and lesson, its top-level position. ${TOP_LEVEL_ORDER_NOTE}`
      ),
    dueBy: z
      .string()
      .optional()
      .describe('Due date in ISO 8601 format (e.g. 2026-05-01T23:59:00Z). Omit to keep unchanged.'),
    isUnlocked: z.boolean().optional().describe('Whether the exercise is unlocked for students.'),
    allowMultipleAttempts: z.boolean().optional().describe('Whether students can re-take the exercise.'),
    completionPolicy: z
      .enum(['submitted', 'passed', 'none'])
      .optional()
      .describe(
        '"submitted" means any submitted attempt completes the exercise. "passed" means the student must meet or exceed passThreshold before the exercise is considered complete. "none" means the exercise does not block course progression and is not required for course completion or certificates.'
      ),
    passThreshold: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe(
        'Passing score percentage from 0 to 100. Use with completionPolicy "passed" when the teacher asks students to pass a threshold before progressing.'
      )
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
      data.allowMultipleAttempts !== undefined ||
      data.completionPolicy !== undefined ||
      data.passThreshold !== undefined,
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

export const updateQuestionSettingsSchema = z
  .object({
    correctValue: z.union([z.number(), z.string(), z.boolean()]).optional(),
    tolerance: z.number().min(0).optional(),
    correctAnswers: z.array(z.string().min(1)).optional(),
    template: z.string().min(1).optional(),
    maxStars: z.number().int().min(1).optional(),
    caseSensitive: z.boolean().optional(),
    distractors: z.array(z.string().min(1)).optional()
  })
  .passthrough()
  .refine((settings) => Object.keys(settings).length > 0, {
    message: 'Provide at least one settings field'
  })
  .describe(QUESTION_SETTINGS_SCHEMA_HINT);

export const updateOptionSchema = z.object({
  id: z.number().int().optional(),
  label: z.string().min(1).optional(),
  isCorrect: z.boolean().optional(),
  settings: updateQuestionSettingsSchema.optional()
});

export const updateQuestionPatchSchema = z
  .object({
    id: z.number().int(),
    question: z.string().min(1).optional(),
    questionTypeId: zEnabledQuestionTypeId.optional(),
    points: z.number().min(1).optional(),
    order: z.number().int().min(0).optional(),
    exerciseSectionId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .describe(
        'Move the question to this in-exercise block (get_exercise_details sections[].id). Use null to clear section assignment.'
      ),
    settings: updateQuestionSettingsSchema.optional(),
    options: z.array(updateOptionSchema).optional()
  })
  .refine(
    (patch) =>
      patch.question !== undefined ||
      patch.questionTypeId !== undefined ||
      patch.points !== undefined ||
      patch.order !== undefined ||
      patch.exerciseSectionId !== undefined ||
      patch.settings !== undefined ||
      patch.options !== undefined,
    {
      message: 'Provide at least one field to update besides id'
    }
  );

export const updateQuestionsParam = z.object({
  exerciseId: z.string(),
  questions: z.array(updateQuestionPatchSchema).min(1)
});
export const coursePlanParam = z.object({ plan: CoursePlanSchema });

const courseTemplateIdParam = z.enum(['product_101', 'product_onboarding', 'expert_on_x']);

/**
 * The model only needs to identify which template to render. The server pulls
 * the form title and field set from the shared registry — keeping the contract
 * server-authoritative means the form can never drift from the pedagogy and
 * the model can't omit `id`s or invent unsupported field types.
 */
export const askTemplateQuestionsParam = z.object({
  templateId: courseTemplateIdParam
});

export const fetchDocumentationUrlParam = z.object({
  url: z.string().url()
});
export const listYoutubePlaylistVideosParam = z.object({
  playlistUrl: z.string().describe('Public YouTube playlist URL containing a `list=` playlist id'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Maximum number of videos to return (default 30, hard cap 50)')
});
export const addYoutubeVideoToLessonParam = z.object({
  lessonId: z.string().describe('ID of the lesson to embed the video in'),
  videoUrl: z.string().describe('YouTube watch, youtu.be, shorts, or embed URL for a single video')
});

// Gemini's tool-schema validator only accepts string enums, so numeric/boolean
// `z.literal` values must be relaxed to plain types in the schemas the model sees.
export const agentLessonTabsOrder = z.array(
  z.object({
    id: z.number().int().min(1).max(4),
    name: z.string()
  })
);
export const agentLandingPageMetadataUpdate = ZCourseLandingPageMetadataUpdateFields.extend({
  lessonTabsOrder: agentLessonTabsOrder.optional(),
  requirements: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
  description: z.string().optional().describe(LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT),
  goals: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
  instructor: z
    .object({
      name: z.string().optional(),
      role: z.string().optional(),
      coursesNo: z.number().optional(),
      description: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
      imgUrl: z.string().optional()
    })
    .optional()
});
export const updateCourseLandingPageParam = ZCourseLandingPageUpdate.extend({
  title: z.string().min(1).optional().describe('Plain-text public course title (no HTML).'),
  description: z.string().min(1).optional().describe(LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT),
  overview: z.string().optional().describe(LANDING_PAGE_SECTION_HTML_AGENT_HINT),
  generateImage: z
    .boolean()
    .optional()
    .describe(
      'Set true to auto-resolve a banner image from Unsplash. The server searches Unsplash using imageQuery if provided, otherwise the course title. Use this to fix a missing-banner blocker — do NOT ask the teacher to describe an image.'
    ),
  imageQuery: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe('Optional Unsplash search query (1–120 chars). Omit to let the server use the course title.'),
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
        order: z
          .number()
          .int()
          .min(1)
          .describe('Top-level position, shared with lessons and exercises outside any section')
      })
    )
    .optional()
    .describe('Reorder sections by setting new order values'),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(['LESSON', 'EXERCISE']),
        order: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            'New order within the section, or the top-level position when the item is outside any section. Top-level positions must be unique across sections, lessons and exercises.'
          ),
        sectionId: z.string().nullable().optional().describe('Move item to a different section')
      })
    )
    .optional()
    .describe('Reorder or move lessons/exercises')
});

export const lessonHistoryParam = z.object({ lessonId: z.string(), locale: ZBlockLocale.default('en') });
export const restoreLessonVersionParam = z.object({
  lessonId: z.string(),
  entryType: z.enum(['text', 'structure']).describe('The entryType of the get_lesson_history entry.'),
  entryId: z.number().int().min(1).describe('The id of the get_lesson_history entry.')
});
export const undoLessonChangeSetParam = z.object({
  lessonId: z.string(),
  changeSetId: z.uuid().describe('The change set to undo, from get_lesson_history.')
});
