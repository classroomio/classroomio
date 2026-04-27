import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { AppError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { ZAgentChatBody } from '@cio/utils/validation/agent';
import {
  ZCourseLandingPageUpdate,
  ZCourseLandingPageMetadataUpdate,
  type TCourseLandingPageUpdate
} from '@cio/utils/validation/course';
import { enforceTokenBalance, recordTokenUsage } from '@api/services/agent/usage';
import { getDocumentText } from '@api/services/agent/document';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { AgentRole, CoursePlanSchema, MAX_STEPS_PER_ROUND, type AgentContext, AIProvider } from '@cio/ai-assistant';
import { createModel, getProviderConfigForProvider } from '@cio/ai-assistant/providers';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID } from '@cio/utils/agent-models';
import { buildSystemPrompt } from '@cio/ai-assistant/prompt';
import { trackAgentEvent, AgentEvent } from '@api/utils/tinybird';
import { redis } from '@api/utils/redis/redis';
import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import { eq } from 'drizzle-orm';

// Services
import { listCourseSections, createCourseSection, updateCourseSectionService } from '@api/services/course/section';
import { createLesson, getLesson, updateLessonService } from '@api/services/lesson/lesson';
import { upsertLessonLanguageService } from '@api/services/lesson-language';
import { createExercise, getExercise, updateExerciseService } from '@api/services/exercise/exercise';
import { reorderCourseContent } from '@api/services/course/content';
import { trimMessageHistory } from '@api/services/agent/context-window';
import { buildUpdatedQuestions } from '@api/services/agent/question-update';
import { normalizeAgentLessonContent } from '@api/services/agent/lesson-content';
import { updateCourseLandingPageService } from '@api/services/course/landing-page';
import { getCourseGoLiveReadiness, publishCourseWhenReady } from '@api/services/course/go-live-readiness';

// ─── Resource Ownership Verification ─────────────────────────────────────────

type ResourceOwnershipRow = {
  courseId: string | null;
  title?: string | null;
};

function buildResourceOwnershipError(params: {
  resourceType: 'Lesson' | 'Exercise' | 'Section';
  resourceId: string;
  courseId: string;
  resource?: ResourceOwnershipRow;
}) {
  const { resourceType, resourceId, resource } = params;

  if (!resource) {
    return new AppError(
      `${resourceType} ${resourceId} does not exist in this course. The ID may have been hallucinated — call get_course_structure to fetch real IDs and retry.`,
      'RESOURCE_NOT_IN_COURSE',
      403
    );
  }

  const titleSuffix = resource.title ? ` (${resource.title})` : '';

  return new AppError(
    `${resourceType} ${resourceId}${titleSuffix} belongs to a different course. Call get_course_structure to fetch IDs for the current course and retry.`,
    'RESOURCE_NOT_IN_COURSE',
    403
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidUuid(resourceType: 'Lesson' | 'Exercise' | 'Section', value: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new AppError(
      `${resourceType} id "${value}" is not a valid UUID. Call get_course_structure to fetch real IDs and try again — never invent or guess UUIDs.`,
      'INVALID_RESOURCE_ID',
      400
    );
  }
}

async function verifyLessonBelongsToCourse(lessonId: string, courseId: string): Promise<void> {
  assertValidUuid('Lesson', lessonId);

  const [lesson] = await db
    .select({ courseId: schema.lesson.courseId, title: schema.lesson.title })
    .from(schema.lesson)
    .where(eq(schema.lesson.id, lessonId))
    .limit(1);

  if (!lesson || lesson.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Lesson',
      resourceId: lessonId,
      courseId,
      resource: lesson
    });
  }
}

async function verifyExerciseBelongsToCourse(exerciseId: string, courseId: string): Promise<void> {
  assertValidUuid('Exercise', exerciseId);

  const [exercise] = await db
    .select({ courseId: schema.exercise.courseId, title: schema.exercise.title })
    .from(schema.exercise)
    .where(eq(schema.exercise.id, exerciseId))
    .limit(1);

  if (!exercise || exercise.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Exercise',
      resourceId: exerciseId,
      courseId,
      resource: exercise
    });
  }
}

async function verifySectionBelongsToCourse(sectionId: string, courseId: string): Promise<void> {
  assertValidUuid('Section', sectionId);

  const [section] = await db
    .select({ courseId: schema.courseSection.courseId, title: schema.courseSection.title })
    .from(schema.courseSection)
    .where(eq(schema.courseSection.id, sectionId))
    .limit(1);

  if (!section || section.courseId !== courseId) {
    throw buildResourceOwnershipError({
      resourceType: 'Section',
      resourceId: sectionId,
      courseId,
      resource: section
    });
  }
}

// ─── Document Context Loading ────────────────────────────────────────────────

type AttachedMessage = { metadata?: { attachment?: { documentId?: string } } };
type PlanMetadataMessage = {
  role?: string;
  metadata?: {
    plan?: {
      action?: string;
      payload?: unknown;
    };
  };
};

function collectDocumentIds(messages: unknown[], currentDocumentId?: string): string[] {
  const ids = new Set<string>();

  for (const msg of messages as AttachedMessage[]) {
    const id = msg?.metadata?.attachment?.documentId;

    if (id) ids.add(id);
  }

  if (currentDocumentId) ids.add(currentDocumentId);

  return Array.from(ids);
}

async function loadDocumentsText(documentIds: string[]): Promise<string | undefined> {
  const loaded = await Promise.all(
    documentIds.map(async (id) => {
      const text = await getDocumentText(id, redis);

      return text ? { id, text } : null;
    })
  );

  const sections = loaded
    .filter((d): d is { id: string; text: string } => d !== null)
    .map((d, i) => `--- Document ${i + 1} (id: ${d.id}) ---\n${d.text}`);

  return sections.length > 0 ? sections.join('\n\n') : undefined;
}

function getLatestImplementationPlan(messages: unknown[]): z.infer<typeof CoursePlanSchema> | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index] as PlanMetadataMessage;

    if (message?.role !== 'user') {
      continue;
    }

    if (message?.metadata?.plan?.action !== 'implement_course_plan') {
      continue;
    }

    const parsedPlan = CoursePlanSchema.safeParse(message.metadata.plan.payload);

    if (parsedPlan.success) {
      return parsedPlan.data;
    }
  }

  return undefined;
}

// ─── Tool Parameter Schemas ──────────────────────────────────────────────────
// courseId is NOT a parameter — it's injected from the authenticated request context.
// This prevents prompt injection from tricking the LLM into targeting another course.

const emptyParam = z.object({});
const lessonReadParam = z.object({ lessonId: z.string(), locale: z.string().default('en') });
const exerciseReadParam = z.object({ exerciseId: z.string() });
const createSectionParam = z.object({ title: z.string().min(1), order: z.number().int().min(0) });
const updateSectionParam = z
  .object({
    sectionId: z.string(),
    title: z.string().min(1).optional(),
    order: z.number().int().min(0).optional()
  })
  .refine((data) => data.title !== undefined || data.order !== undefined, {
    message: 'Provide at least one field to update'
  });
const createLessonParam = z.object({ sectionId: z.string(), title: z.string().min(1), order: z.number().int().min(0) });
const updateLessonParam = z
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
const updateContentParam = z.object({
  lessonId: z.string(),
  locale: z.string().default('en'),
  content: z.string().min(1)
});

const questionSchema = z.object({
  question: z.string().min(1),
  questionTypeId: z.number().int().min(1).max(14).default(1),
  points: z.number().min(0).default(1),
  order: z.number().int().min(0),
  options: z.array(z.object({ label: z.string().min(1), isCorrect: z.boolean() }))
});

const createExerciseParam = z.object({
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

const updateExerciseParam = z
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

const addQuestionsParam = z.object({ exerciseId: z.string(), questions: z.array(questionSchema) });

const updateOptionSchema = z.object({
  id: z.number().int().optional(),
  label: z.string().min(1).optional(),
  isCorrect: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional()
});

const updateQuestionPatchSchema = z.object({
  id: z.number().int(),
  question: z.string().min(1).optional(),
  questionTypeId: z.number().int().min(1).max(14).optional(),
  points: z.number().min(0).optional(),
  order: z.number().int().min(0).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  options: z.array(updateOptionSchema).optional()
});

const updateQuestionsParam = z.object({
  exerciseId: z.string(),
  questions: z.array(updateQuestionPatchSchema).min(1)
});
const coursePlanParam = z.object({ plan: CoursePlanSchema });

// Gemini's tool-schema validator only accepts string enums, so numeric/boolean
// `z.literal` values must be relaxed to plain types in the schemas the model sees.
const agentLessonTabsOrder = z.array(
  z.object({
    id: z.number().int().min(1).max(4),
    name: z.string()
  })
);
const agentLandingPageMetadataUpdate = ZCourseLandingPageMetadataUpdate.extend({
  lessonTabsOrder: agentLessonTabsOrder.optional()
});
const updateCourseLandingPageParam = ZCourseLandingPageUpdate.extend({
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
const goLiveParam = z.object({
  confirmPublish: z
    .boolean()
    .describe('Must be true. Only use this after the teacher explicitly asks to publish or go live.')
});

const reorderContentParam = z.object({
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

// ─── Tool Builder ────────────────────────────────────────────────────────────

function summarizeAgentDebugValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;

  if (typeof value === 'string') {
    return value.length > 200 ? `${value.slice(0, 200)}… (${value.length} chars)` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return `[Array(${value.length})]`;
    }

    return {
      count: value.length,
      items: value.slice(0, 3).map((item) => summarizeAgentDebugValue(item, depth + 1))
    };
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[Object]';
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        summarizeAgentDebugValue(nestedValue, depth + 1)
      ])
    );
  }

  return String(value);
}

function logAgentToolDebug(
  phase: 'start' | 'success' | 'error',
  toolName: string,
  details: { courseId: string; userId: string; args?: unknown; result?: unknown; error?: unknown }
) {
  const base = `[agent-tool:${phase}] ${toolName}`;

  if (phase === 'error') {
    console.error(base, {
      courseId: details.courseId,
      userId: details.userId,
      args: summarizeAgentDebugValue(details.args),
      error:
        details.error instanceof Error
          ? {
              message: details.error.message,
              stack: details.error.stack
            }
          : summarizeAgentDebugValue(details.error)
    });
    return;
  }

  console.info(base, {
    courseId: details.courseId,
    userId: details.userId,
    args: summarizeAgentDebugValue(details.args),
    result: summarizeAgentDebugValue(details.result)
  });
}

/**
 * Hide raw DB driver / SQL leakage from anything that gets surfaced to the chat UI
 * or the model's tool-error part. Postgres-js attaches the failed query SQL and
 * params to the error message, which is noisy and unsafe to show users.
 */
function sanitizeToolError(toolName: string, error: unknown): Error {
  if (error instanceof AppError) {
    return error;
  }

  const raw = error instanceof Error ? error.message : String(error);
  const looksLikeSqlLeak =
    /^Failed query:/i.test(raw) ||
    /\bparams:\s/i.test(raw) ||
    /\binvalid input syntax for type uuid\b/i.test(raw) ||
    /\bselect\s+.+\bfrom\s+/i.test(raw);

  if (looksLikeSqlLeak) {
    return new Error(
      `${toolName} failed because of an invalid or unknown ID. Call get_course_structure to fetch the current IDs and retry — never invent UUIDs.`
    );
  }

  return error instanceof Error ? error : new Error(raw);
}

async function executeAgentTool<TArgs, TResult>(
  toolName: string,
  params: { orgId: string; userId: string; courseId: string; args?: TArgs },
  execute: () => Promise<TResult>
): Promise<TResult> {
  trackAgentEvent(AgentEvent.TOOL_CALLED, {
    orgId: params.orgId,
    userId: params.userId,
    courseId: params.courseId,
    toolName
  });
  logAgentToolDebug('start', toolName, {
    courseId: params.courseId,
    userId: params.userId,
    args: params.args
  });

  try {
    const result = await execute();

    trackAgentEvent(AgentEvent.TOOL_COMPLETED, {
      orgId: params.orgId,
      userId: params.userId,
      courseId: params.courseId,
      toolName,
      success: true
    });
    logAgentToolDebug('success', toolName, {
      courseId: params.courseId,
      userId: params.userId,
      args: params.args,
      result
    });

    return result;
  } catch (error) {
    logAgentToolDebug('error', toolName, {
      courseId: params.courseId,
      userId: params.userId,
      args: params.args,
      error
    });

    throw sanitizeToolError(toolName, error);
  }
}

function buildAgentTools(orgId: string, userId: string, courseId: string) {
  return {
    get_course_structure: tool({
      description:
        'Get the full course structure including sections, lessons, and exercises as a tree. The courseId is automatically set — do not pass it.',
      inputSchema: emptyParam,
      execute: async () => {
        return executeAgentTool('get_course_structure', { orgId, userId, courseId }, async () => {
          const [items, sections] = await Promise.all([getCourseContentItems(courseId), listCourseSections(courseId)]);
          return { sections, items };
        });
      }
    }),

    get_lesson_content: tool({
      description: 'Get the HTML content of a specific lesson in this course.',
      inputSchema: lessonReadParam,
      execute: async (args) => {
        return executeAgentTool('get_lesson_content', { orgId, userId, courseId, args }, async () => {
          await verifyLessonBelongsToCourse(args.lessonId, courseId);
          const lesson = await getLesson(args.lessonId);
          const lessonWithLangs = lesson as {
            id: string;
            title: string;
            lessonLanguages?: Array<{ locale: string; content: string | null }>;
          };
          const langContent = lessonWithLangs.lessonLanguages?.find((ll) => ll.locale === args.locale);
          return { id: lesson.id, title: lesson.title, content: langContent?.content || null, locale: args.locale };
        });
      }
    }),

    get_exercise_details: tool({
      description: 'Get an exercise with all its questions and answer options from this course.',
      inputSchema: exerciseReadParam,
      execute: async (args) => {
        return executeAgentTool('get_exercise_details', { orgId, userId, courseId, args }, async () => {
          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);
          return getExercise(args.exerciseId);
        });
      }
    }),

    create_section: tool({
      description: 'Create a new section in this course.',
      inputSchema: createSectionParam,
      execute: async (args) => {
        return executeAgentTool('create_section', { orgId, userId, courseId, args }, async () => {
          const section = await createCourseSection(courseId, { title: args.title, courseId, order: args.order });
          return { id: section.id, title: section.title, order: section.order };
        });
      }
    }),

    update_section: tool({
      description:
        'Update metadata for an existing section in this course. Use this to rename a section or change its order instead of creating a new section.',
      inputSchema: updateSectionParam,
      execute: async (args) => {
        return executeAgentTool('update_section', { orgId, userId, courseId, args }, async () => {
          await verifySectionBelongsToCourse(args.sectionId, courseId);
          const section = await updateCourseSectionService(args.sectionId, {
            ...(args.title !== undefined ? { title: args.title } : {}),
            ...(args.order !== undefined ? { order: args.order } : {})
          });

          return { id: section.id, title: section.title, updated: true };
        });
      }
    }),

    create_lesson: tool({
      description:
        'Create a new lesson within a section of this course. Use update_lesson_content after to add content.',
      inputSchema: createLessonParam,
      execute: async (args) => {
        return executeAgentTool('create_lesson', { orgId, userId, courseId, args }, async () => {
          await verifySectionBelongsToCourse(args.sectionId, courseId);
          const lesson = await createLesson(courseId, {
            title: args.title,
            courseId,
            sectionId: args.sectionId,
            order: args.order
          });
          return { id: lesson.id, title: lesson.title, order: lesson.order };
        });
      }
    }),

    update_lesson: tool({
      description:
        'Update metadata for an existing lesson in this course. Use this to rename, move, reorder, schedule, or change visibility/unlock settings instead of creating a new lesson.',
      inputSchema: updateLessonParam,
      execute: async (args) => {
        return executeAgentTool('update_lesson', { orgId, userId, courseId, args }, async () => {
          if (args.sectionId) {
            await verifySectionBelongsToCourse(args.sectionId, courseId);
          }

          await verifyLessonBelongsToCourse(args.lessonId, courseId);
          const lesson = await updateLessonService(args.lessonId, {
            ...(args.title !== undefined ? { title: args.title } : {}),
            ...(args.sectionId !== undefined ? { sectionId: args.sectionId } : {}),
            ...(args.order !== undefined ? { order: args.order } : {}),
            ...(args.lessonAt !== undefined ? { lessonAt: args.lessonAt } : {}),
            ...(args.callUrl !== undefined ? { callUrl: args.callUrl } : {}),
            ...(args.isUnlocked !== undefined ? { isUnlocked: args.isUnlocked } : {}),
            ...(args.public !== undefined ? { public: args.public } : {})
          });

          return { id: lesson.id, title: lesson.title, updated: true };
        });
      }
    }),

    update_lesson_content: tool({
      description:
        'Update the text content of a lesson in this course. Replaces full lesson HTML for the given locale. For lesson HTML, put only the lesson body in the content. Do not include the lesson title. Do not use h1 or h2 anywhere in lesson HTML. Start headings at h3 because that is the highest heading level allowed in lesson content.',
      inputSchema: updateContentParam,
      execute: async (args) => {
        return executeAgentTool('update_lesson_content', { orgId, userId, courseId, args }, async () => {
          await verifyLessonBelongsToCourse(args.lessonId, courseId);
          const lesson = await getLesson(args.lessonId);
          const normalizedContent = normalizeAgentLessonContent(args.content, lesson.title);

          await upsertLessonLanguageService(args.lessonId, {
            locale: args.locale as 'en',
            content: normalizedContent
          });
          return {
            lessonId: args.lessonId,
            locale: args.locale,
            contentLength: normalizedContent.length,
            updated: true
          };
        });
      }
    }),

    create_exercise: tool({
      description: 'Create a new exercise with questions and answer options in this course.',
      inputSchema: createExerciseParam,
      execute: async (args) => {
        return executeAgentTool('create_exercise', { orgId, userId, courseId, args }, async () => {
          if (args.lessonId) {
            await verifyLessonBelongsToCourse(args.lessonId, courseId);
          }

          if (args.sectionId) {
            await verifySectionBelongsToCourse(args.sectionId, courseId);
          }

          const exercise = await createExercise({
            title: args.title,
            description: args.description,
            courseId,
            lessonId: args.lessonId,
            sectionId: args.sectionId,
            order: args.order,
            questions: args.questions.map((q, i) => ({
              question: q.question,
              questionTypeId: q.questionTypeId,
              points: q.points,
              order: q.order ?? i,
              options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect }))
            }))
          });
          return { id: exercise.id, title: exercise.title, questionCount: args.questions.length };
        });
      }
    }),

    update_exercise: tool({
      description:
        "Update an existing exercise's metadata (title, description, linked lesson, section, order, due date, lock state, allow-multiple-attempts). Use this for editing the exercise itself — not for changing its questions. To edit questions, use update_questions; to add questions, use add_questions.",
      inputSchema: updateExerciseParam,
      execute: async (args) => {
        return executeAgentTool('update_exercise', { orgId, userId, courseId, args }, async () => {
          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          if (args.lessonId) {
            await verifyLessonBelongsToCourse(args.lessonId, courseId);
          }

          if (args.sectionId) {
            await verifySectionBelongsToCourse(args.sectionId, courseId);
          }

          const updated = await updateExerciseService(args.exerciseId, {
            title: args.title,
            description: args.description,
            lessonId: args.lessonId,
            sectionId: args.sectionId,
            order: args.order,
            dueBy: args.dueBy,
            isUnlocked: args.isUnlocked,
            allowMultipleAttempts: args.allowMultipleAttempts
          });

          return {
            id: updated.id,
            title: updated.title,
            description: updated.description ?? null,
            dueBy: updated.dueBy ?? null,
            updated: true
          };
        });
      }
    }),

    add_questions: tool({
      description: 'Add questions to an existing exercise in this course.',
      inputSchema: addQuestionsParam,
      execute: async (args) => {
        return executeAgentTool('add_questions', { orgId, userId, courseId, args }, async () => {
          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          const existingExercise = await getExercise(args.exerciseId);
          const existingQuestions = existingExercise.questions || [];
          const nextOrder = existingQuestions.length;

          const newQuestions = args.questions.map((q, i) => ({
            question: q.question,
            questionTypeId: q.questionTypeId,
            points: q.points,
            order: q.order ?? nextOrder + i,
            options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect }))
          }));

          const allQuestions = [
            ...existingQuestions.map((eq) => ({
              id: Number(eq.id),
              question: eq.title,
              questionTypeId: eq.questionTypeId,
              points: eq.points,
              order: eq.order,
              options: eq.options.map((o) => ({ id: Number(o.id), label: o.label || '', isCorrect: o.isCorrect }))
            })),
            ...newQuestions
          ];

          await updateExerciseService(args.exerciseId, { questions: allQuestions });
          return { exerciseId: args.exerciseId, addedCount: args.questions.length, totalCount: allQuestions.length };
        });
      }
    }),

    update_questions: tool({
      description:
        'Update existing questions in an exercise. Pass only fields you want to change; `id` identifies the question. For NUMERIC, the correct answer is `settings.correctValue` (number) — do NOT add options to NUMERIC questions. For STAR use `settings.correctValue`. For WORD_BANK use `settings.correctAnswers` and `settings.template`. RADIO/CHECKBOX/TRUE_FALSE use `options[].isCorrect` (include option `id` to edit, omit `id` to add). `settings` is shallow-merged with existing settings. Omit `options` entirely to leave existing options untouched.',
      inputSchema: updateQuestionsParam,
      execute: async (args) => {
        return executeAgentTool('update_questions', { orgId, userId, courseId, args }, async () => {
          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          const existing = await getExercise(args.exerciseId);
          const merged = buildUpdatedQuestions(
            (existing.questions || []).map((q) => ({
              id: q.id,
              title: q.title,
              questionTypeId: q.questionTypeId,
              points: q.points,
              order: q.order,
              settings: q.settings,
              options: q.options
            })),
            args.questions,
            args.exerciseId
          );

          await updateExerciseService(args.exerciseId, { questions: merged });

          return { exerciseId: args.exerciseId, updatedCount: merged.length };
        });
      }
    }),

    reorder_content: tool({
      description:
        'Reorder sections, lessons, or exercises in this course. Can change the order of sections, change the order of lessons/exercises within a section, or move items between sections. Use get_course_structure first to see current order, and copy item IDs exactly from that response. Never rewrite or guess UUIDs.',
      inputSchema: reorderContentParam,
      execute: async (args) => {
        return executeAgentTool('reorder_content', { orgId, userId, courseId, args }, async () => {
          if (args.sections) {
            for (const section of args.sections) {
              await verifySectionBelongsToCourse(section.id, courseId);
            }
          }

          if (args.items) {
            for (const item of args.items) {
              if (item.type === 'LESSON') {
                await verifyLessonBelongsToCourse(item.id, courseId);
              } else {
                await verifyExerciseBelongsToCourse(item.id, courseId);
              }

              if (item.sectionId) {
                await verifySectionBelongsToCourse(item.sectionId, courseId);
              }
            }
          }

          return reorderCourseContent(courseId, {
            sections: args.sections,
            items: args.items
          });
        });
      }
    }),

    update_course_landing_page: tool({
      description:
        'Update course-level landing page fields for this course, including public title, description, overview, goals, requirements, instructor metadata, pricing, and banner image. The courseId is automatically set — do not pass it.',
      inputSchema: updateCourseLandingPageParam,
      execute: async (args) => {
        return executeAgentTool('update_course_landing_page', { orgId, userId, courseId, args }, async () => {
          const result = await updateCourseLandingPageService(courseId, args as TCourseLandingPageUpdate);

          return {
            courseId: result.course.id,
            title: result.course.title,
            description: result.course.description,
            courseUrl: result.courseUrl,
            bannerImageUrl: result.bannerImageUrl,
            updated: true
          };
        });
      }
    }),

    check_course_go_live_readiness: tool({
      description:
        'Check whether this course is ready to go live. Returns blockers, warnings, suggested fixes, and the public course URL if available. This tool does not publish the course.',
      inputSchema: emptyParam,
      execute: async () => {
        return executeAgentTool('check_course_go_live_readiness', { orgId, userId, courseId }, async () => {
          return getCourseGoLiveReadiness(courseId);
        });
      }
    }),

    go_live_course: tool({
      description:
        'Publish this course only after the teacher explicitly asks to go live. Runs the readiness checklist first, generates a slug when needed, and fails with blockers if the course is not ready.',
      inputSchema: goLiveParam,
      execute: async (args) => {
        return executeAgentTool('go_live_course', { orgId, userId, courseId, args }, async () => {
          const result = await publishCourseWhenReady(courseId);

          return {
            courseId: result.course.id,
            title: result.course.title,
            slug: result.course.slug,
            isPublished: result.course.isPublished,
            readiness: result.readiness
          };
        });
      }
    }),

    generate_course_plan: tool({
      description:
        'Generate a structured course plan with sections and lessons. Always use this when asked to design or plan a course.',
      inputSchema: coursePlanParam,
      execute: async (args) => {
        return executeAgentTool('generate_course_plan', { orgId, userId, courseId, args }, async () => {
          const sectionCount = args.plan.sections.length;
          const itemCount = args.plan.sections.reduce(
            (sum: number, section: { items: unknown[] }) => sum + section.items.length,
            0
          );

          trackAgentEvent(AgentEvent.PLAN_GENERATED, { orgId, userId, courseId, sectionCount, itemCount });

          return args.plan;
        });
      }
    })
  };
}

// ─── Chat Route ──────────────────────────────────────────────────────────────

export const agentChatRouter = new Hono().post(
  '/chat',
  authMiddleware,
  orgMemberMiddleware,
  zValidator('json', ZAgentChatBody),
  async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;

    try {
      const { courseId, messages, context, model: requestedModel } = c.req.valid('json');

      const modelId = requestedModel ?? DEFAULT_PICKER_MODEL_ID;
      const modelDescriptor = AGENT_MODELS[modelId];
      const baseProviderConfig = getProviderConfigForProvider(modelDescriptor.provider as AIProvider);

      if (!baseProviderConfig) {
        throw new AppError(`AI assistant is not configured for model "${modelId}"`, 'AI_NOT_CONFIGURED', 503);
      }

      const providerConfig = { ...baseProviderConfig, model: modelDescriptor.backendModelId };

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      if (role === AgentRole.STUDENT) {
        throw new AppError('AI assistant is not available for students yet', 'STUDENT_NOT_SUPPORTED', 403);
      }

      await enforceTokenBalance(orgId);

      const documentIds = collectDocumentIds(messages, context?.documentId);
      const documentText = documentIds.length > 0 ? await loadDocumentsText(documentIds) : undefined;

      const existingSections = await listCourseSections(courseId);

      const [courseRow] = await db
        .select({ title: schema.course.title, description: schema.course.description })
        .from(schema.course)
        .where(eq(schema.course.id, courseId))
        .limit(1);

      if (!courseRow) {
        throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
      }

      // Fetch lesson details if viewing a specific lesson
      let lessonTitle: string | undefined;
      let lessonContent: string | undefined;
      if (context?.lessonId) {
        try {
          await verifyLessonBelongsToCourse(context.lessonId, courseId);
          const lesson = await getLesson(context.lessonId);
          lessonTitle = lesson.title;
          const lessonWithLangs = lesson as {
            lessonLanguages?: Array<{ locale: string; content: string | null }>;
          };
          const langContent = lessonWithLangs.lessonLanguages?.find((ll) => ll.locale === 'en');
          lessonContent = langContent?.content || undefined;
        } catch {
          // Lesson not found or doesn't belong — continue without lesson context
        }
      }

      // Fetch exercise details if viewing a specific exercise
      let exerciseTitle: string | undefined;
      if (context?.exerciseId) {
        try {
          await verifyExerciseBelongsToCourse(context.exerciseId, courseId);
          const exercise = await getExercise(context.exerciseId);
          exerciseTitle = exercise.title;
        } catch {
          // Exercise not found or doesn't belong — continue without exercise context
        }
      }

      const agentContext: AgentContext = {
        orgId,
        courseId,
        courseTitle: courseRow.title,
        courseDescription: courseRow.description || undefined,
        userId: user.id,
        role,
        locale: 'en',
        lessonId: context?.lessonId,
        lessonTitle,
        lessonContent,
        exerciseId: context?.exerciseId,
        exerciseTitle,
        documentId: context?.documentId,
        documentText,
        existingSectionCount: existingSections.length
      };

      trackAgentEvent(AgentEvent.CHAT_STARTED, {
        orgId,
        userId: user.id,
        courseId,
        role,
        hasDocument: !!documentText,
        messageCount: messages.length
      });

      const startTime = Date.now();
      const model = createModel(providerConfig);
      const approvedPlan = getLatestImplementationPlan(messages);
      const systemPrompt = [
        buildSystemPrompt(agentContext),
        approvedPlan
          ? [
              '',
              'The latest user message approved a final course plan for immediate execution.',
              'Implement that exact plan directly without asking the user to restate it.',
              'Treat this approved plan as the canonical source if it differs from any earlier draft.',
              `Approved plan JSON:\n${JSON.stringify(approvedPlan, null, 2)}`
            ].join('\n')
          : ''
      ].join('\n');
      const agentTools = buildAgentTools(orgId, user.id, courseId);

      const trimmedMessages = trimMessageHistory(messages);
      const modelMessages = await convertToModelMessages(trimmedMessages);

      const result = streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(MAX_STEPS_PER_ROUND),
        onFinish: async ({ usage }) => {
          const durationMs = Date.now() - startTime;
          const inputTokens = usage?.inputTokens ?? 0;
          const outputTokens = usage?.outputTokens ?? 0;

          if (usage) {
            await recordTokenUsage(
              orgId,
              user.id,
              courseId,
              {
                promptTokens: inputTokens,
                completionTokens: outputTokens,
                totalTokens: inputTokens + outputTokens
              },
              providerConfig.model || providerConfig.provider
            );
          }

          trackAgentEvent(AgentEvent.CHAT_COMPLETED, {
            orgId,
            userId: user.id,
            courseId,
            inputTokens,
            outputTokens,
            model: providerConfig.model || providerConfig.provider,
            durationMs
          });
        }
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      trackAgentEvent(AgentEvent.CHAT_ERROR, {
        orgId,
        userId: user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof AppError) {
        return c.json({ success: false, error: error.message, code: error.code }, error.statusCode);
      }

      console.error('Agent chat error:', error);
      return c.json({ success: false, error: 'Failed to process chat message', code: 'INTERNAL_ERROR' }, 500);
    }
  }
);
