import { createHash } from 'node:crypto';

import { tool } from 'ai';
import { CoursePlanSchema, getCourseTemplate } from '@cio/ai-assistant';
import { PREMIUM_QUESTION_TYPE_KEYS, QUESTION_TYPE_ID_TO_KEY, QUESTION_TYPE_REGISTRY } from '@cio/question-types';
import { AppError } from '@cio/utils/errors';
import { trackAgentEvent, AgentEvent } from '../../utils/tinybird';
import {
  createAgentRunEvent,
  getAgentRunById,
  getAgentRunStep,
  updateAgentRun,
  upsertAgentRunStep
} from '@cio/db/queries/agent';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { getExerciseSectionsByExerciseId } from '@cio/db/queries/exercise';
import type { TCourseLandingPageUpdate } from '@cio/utils/validation/course';
import { listCourseSections, createCourseSection, updateCourseSectionService } from '../course/section';
import { createLesson, getLesson, updateLessonService } from '../lesson/lesson';
import { upsertLessonLanguageService } from '../lesson-language';
import {
  createExercise,
  getExercise,
  createExerciseSectionService,
  updateExerciseService,
  updateExerciseSectionMetadataService
} from '../exercise/exercise';
import { reorderCourseContent } from '../course/content';
import { normalizeAgentLessonContent } from './lesson-content';
import { buildUpdatedQuestions } from './question-update';
import { updateCourseLandingPageService } from '../course/landing-page';
import { getCourseGoLiveReadiness, publishCourseWhenReady } from '../course/go-live-readiness';
import {
  assertValidUuid,
  verifyExerciseBelongsToCourse,
  verifyLessonBelongsToCourse,
  verifySectionBelongsToCourse
} from './chat-context';
import { balanceCorrectAnswerPositions } from './balance-answer-positions';
import {
  addQuestionsParam,
  askTemplateQuestionsParam,
  coursePlanParam,
  createExerciseParam,
  createExerciseSectionParam,
  createLessonParam,
  createSectionParam,
  emptyParam,
  exerciseReadParam,
  fetchDocumentationUrlParam,
  goLiveParam,
  lessonReadParam,
  reorderContentParam,
  updateContentParam,
  updateCourseLandingPageParam,
  updateExerciseParam,
  updateExerciseSectionParam,
  updateLessonParam,
  updateQuestionsParam,
  updateSectionParam
} from './agent-tool-schemas';
import { fetchDocumentationUrl } from './fetch-url';

const DURABLE_AGENT_TOOL_NAMES = new Set([
  'create_section',
  'update_section',
  'create_lesson',
  'update_lesson',
  'update_lesson_content',
  'create_exercise',
  'update_exercise',
  'update_exercise_section',
  'create_exercise_section',
  'add_questions',
  'update_questions',
  'reorder_content',
  'update_course_landing_page',
  'go_live_course'
]);

export interface BuildAgentToolsOptions {
  runId?: string;
  /**
   * Whether the org owning this course is on a paid plan. Defaults to true to
   * preserve historical behavior for callers (MCP, durable run resumers) that
   * don't pass it. When false, the question-creation tools refuse to accept
   * premium-only question types.
   */
  isOrgOnPaidPlan?: boolean;
}

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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);

  return `{${entries.join(',')}}`;
}

function hashToolInput(toolName: string, args: unknown): string {
  return createHash('sha256').update(stableStringify({ toolName, args })).digest('hex');
}

function toCheckpointOutput(result: unknown): Record<string, unknown> {
  return { result };
}

function extractCheckpointResult(output: Record<string, unknown> | null): unknown {
  if (!output || !Object.prototype.hasOwnProperty.call(output, 'result')) {
    return undefined;
  }

  return output.result;
}

function extractOutputIds(result: unknown): string[] {
  if (!result || typeof result !== 'object') {
    return [];
  }

  const record = result as Record<string, unknown>;
  const ids = [record.id, record.lessonId, record.exerciseId, record.courseId].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );

  return [...new Set(ids)];
}

function toErrorPayload(error: unknown): { code: string; message: string; details?: unknown } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    return { code: 'TOOL_ERROR', message: error.message };
  }

  return { code: 'TOOL_ERROR', message: String(error) };
}

async function assertRunNotCanceled(runId: string): Promise<void> {
  const run = await getAgentRunById(runId);

  if (!run) {
    throw new AppError('Agent run not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  if (run.status === 'canceled' || run.cancelRequestedAt) {
    throw new AppError('Agent run was canceled', 'AGENT_RUN_CANCELED', 409);
  }
}

async function executeCheckpointedAgentTool<TArgs, TResult>(
  toolName: string,
  params: { orgId: string; userId: string; courseId: string; args?: TArgs },
  runId: string,
  execute: () => Promise<TResult>
): Promise<TResult> {
  await assertRunNotCanceled(runId);

  const inputHash = hashToolInput(toolName, params.args ?? {});
  const stepKey = `${toolName}:${inputHash.slice(0, 48)}`;
  const existingStep = await getAgentRunStep(runId, stepKey);

  if (existingStep?.status === 'completed') {
    const checkpointResult = extractCheckpointResult(existingStep.output);

    if (checkpointResult !== undefined) {
      await createAgentRunEvent({
        runId,
        eventType: 'tool.skipped',
        message: `Skipped ${toolName}; checkpoint already completed`,
        payload: { toolName, stepKey, outputIds: existingStep.outputIds }
      });

      return checkpointResult as TResult;
    }
  }

  const now = new Date().toISOString();

  await updateAgentRun({
    runId,
    userId: params.userId,
    status: 'running',
    phase: 'implementing',
    currentStepKey: stepKey,
    lockedAt: now
  });

  await upsertAgentRunStep({
    runId,
    stepKey,
    stepType: `tool:${toolName}`,
    status: 'running',
    inputHash,
    input: { toolName, args: (params.args ?? {}) as Record<string, unknown> },
    attempt: existingStep ? existingStep.attempt + 1 : 0,
    startedAt: now,
    finishedAt: null
  });

  await createAgentRunEvent({
    runId,
    eventType: 'tool.started',
    message: `Started ${toolName}`,
    payload: { toolName, stepKey }
  });

  try {
    const result = await execute();
    const finishedAt = new Date().toISOString();
    const outputIds = extractOutputIds(result);

    await upsertAgentRunStep({
      runId,
      stepKey,
      stepType: `tool:${toolName}`,
      status: 'completed',
      inputHash,
      input: { toolName, args: (params.args ?? {}) as Record<string, unknown> },
      output: toCheckpointOutput(result),
      outputIds,
      attempt: existingStep ? existingStep.attempt + 1 : 0,
      startedAt: existingStep?.startedAt ?? now,
      finishedAt
    });

    await createAgentRunEvent({
      runId,
      eventType: 'tool.completed',
      message: `Completed ${toolName}`,
      payload: { toolName, stepKey, outputIds }
    });

    return result;
  } catch (error) {
    const errorPayload = toErrorPayload(error);

    await upsertAgentRunStep({
      runId,
      stepKey,
      stepType: `tool:${toolName}`,
      status: 'failed',
      inputHash,
      input: { toolName, args: (params.args ?? {}) as Record<string, unknown> },
      error: errorPayload,
      attempt: existingStep ? existingStep.attempt + 1 : 0,
      startedAt: existingStep?.startedAt ?? now,
      finishedAt: new Date().toISOString()
    });

    await createAgentRunEvent({
      runId,
      eventType: 'tool.failed',
      message: `${toolName} failed`,
      payload: { toolName, stepKey, error: errorPayload }
    });

    throw error;
  }
}

async function executeAgentToolBase<TArgs, TResult>(
  toolName: string,
  params: { orgId: string; userId: string; courseId: string; args?: TArgs },
  execute: () => Promise<TResult>,
  options: BuildAgentToolsOptions = {}
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
    const result =
      options.runId && DURABLE_AGENT_TOOL_NAMES.has(toolName)
        ? await executeCheckpointedAgentTool(toolName, params, options.runId, execute)
        : await execute();

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

function assertNoPremiumQuestionTypes(
  questionTypeIds: ReadonlyArray<number | undefined | null>,
  isOrgOnPaidPlan: boolean
): void {
  if (isOrgOnPaidPlan) return;

  const blockedTypenames = new Set<string>();
  for (const typeId of questionTypeIds) {
    if (typeId == null) continue;

    const key = QUESTION_TYPE_ID_TO_KEY[typeId];
    if (key && PREMIUM_QUESTION_TYPE_KEYS.has(key)) {
      const registry = QUESTION_TYPE_REGISTRY.find((t) => t.id === typeId);
      blockedTypenames.add(registry?.typename ?? key);
    }
  }

  if (blockedTypenames.size === 0) return;

  const allowed = QUESTION_TYPE_REGISTRY.filter((t) => !PREMIUM_QUESTION_TYPE_KEYS.has(t.key))
    .map((t) => t.typename)
    .join(', ');

  throw new AppError(
    `Question type(s) ${Array.from(blockedTypenames).join(', ')} require a paid plan and are not available on this org. Use one of: ${allowed}.`,
    'UPGRADE_REQUIRED',
    403
  );
}

export function buildAgentTools(
  orgId: string,
  userId: string,
  courseId: string,
  priorMessages: unknown[],
  options: BuildAgentToolsOptions = {}
) {
  const isOrgOnPaidPlan = options.isOrgOnPaidPlan ?? true;

  const executeAgentTool = <TArgs, TResult>(
    toolName: string,
    params: { orgId: string; userId: string; courseId: string; args?: TArgs },
    execute: () => Promise<TResult>
  ) => executeAgentToolBase(toolName, params, execute, options);

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
      description:
        'Get an exercise with sections, questions, and answer options from this course. Each sections entry has an id — use it with update_exercise_section to change that question block title or description.',
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
            lessonTitle: lesson.title,
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
          assertNoPremiumQuestionTypes(
            args.questions.map((q) => q.questionTypeId),
            isOrgOnPaidPlan
          );

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
            questions: balanceCorrectAnswerPositions(args.questions).map((q, i) => ({
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

    update_exercise_section: tool({
      description:
        'Update the title and/or description of one section inside an exercise (question groups). This is not the same as update_section, which edits course outline sections. Always use ids from get_exercise_details `sections` for this tool.',
      inputSchema: updateExerciseSectionParam,
      execute: async (args) => {
        return executeAgentTool('update_exercise_section', { orgId, userId, courseId, args }, async () => {
          assertValidUuid('Exercise', args.exerciseId);
          assertValidUuid('ExerciseSection', args.exerciseSectionId);

          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          const updated = await updateExerciseSectionMetadataService(args.exerciseId, args.exerciseSectionId, {
            ...(args.title !== undefined ? { title: args.title } : {}),
            ...(args.description !== undefined ? { description: args.description } : {})
          });

          return { ...updated, updated: true };
        });
      }
    }),

    create_exercise_section: tool({
      description:
        'Create a new section inside an existing exercise. Use this to add a question block before adding or moving questions into it.',
      inputSchema: createExerciseSectionParam,
      execute: async (args) => {
        return executeAgentTool('create_exercise_section', { orgId, userId, courseId, args }, async () => {
          assertValidUuid('Exercise', args.exerciseId);

          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          const created = await createExerciseSectionService(args.exerciseId, {
            title: args.title,
            description: args.description,
            order: args.order,
            colorTheme: args.colorTheme,
            afterBehavior: args.afterBehavior
          });

          return { ...created, created: true };
        });
      }
    }),

    add_questions: tool({
      description:
        'Add questions to an existing exercise in this course. When get_exercise_details lists in-exercise sections, pass exerciseSectionId so new questions are added to the correct block.',
      inputSchema: addQuestionsParam,
      execute: async (args) => {
        return executeAgentTool('add_questions', { orgId, userId, courseId, args }, async () => {
          assertNoPremiumQuestionTypes(
            args.questions.map((q) => q.questionTypeId),
            isOrgOnPaidPlan
          );

          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          if (args.exerciseSectionId !== undefined) {
            assertValidUuid('ExerciseSection', args.exerciseSectionId);

            const sections = await getExerciseSectionsByExerciseId(args.exerciseId);
            const belongs = sections.some((section) => section.id === args.exerciseSectionId);

            if (!belongs) {
              throw new AppError(
                'That exercise section was not found on this exercise. Call get_exercise_details and use a section id from the sections array.',
                'VALIDATION_ERROR',
                404
              );
            }
          }

          const existingExercise = await getExercise(args.exerciseId);
          const existingQuestions = existingExercise.questions || [];
          const nextOrder = existingQuestions.length;

          const newQuestions = balanceCorrectAnswerPositions(args.questions).map((q, i) => ({
            question: q.question,
            questionTypeId: q.questionTypeId,
            points: q.points,
            order: q.order ?? nextOrder + i,
            ...(args.exerciseSectionId !== undefined ? { exerciseSectionId: args.exerciseSectionId } : {}),
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
          return {
            exerciseId: args.exerciseId,
            exerciseTitle: existingExercise.title,
            addedCount: args.questions.length,
            totalCount: allQuestions.length
          };
        });
      }
    }),

    update_questions: tool({
      description:
        'Update existing questions in an exercise. Pass only fields you want to change; `id` identifies the question. Optional `exerciseSectionId` moves the question to another in-exercise block (use get_exercise_details section ids), or null to unassign. For NUMERIC, the correct answer is `settings.correctValue` (number) — do NOT add options to NUMERIC questions. For STAR use `settings.correctValue`. For WORD_BANK use `settings.correctAnswers` and `settings.template`. RADIO/CHECKBOX/TRUE_FALSE use `options[].isCorrect` (include option `id` to edit, omit `id` to add). `settings` is shallow-merged with existing settings. Omit `options` entirely to leave existing options untouched.',
      inputSchema: updateQuestionsParam,
      execute: async (args) => {
        return executeAgentTool('update_questions', { orgId, userId, courseId, args }, async () => {
          assertNoPremiumQuestionTypes(
            args.questions.map((q) => q.questionTypeId),
            isOrgOnPaidPlan
          );

          await verifyExerciseBelongsToCourse(args.exerciseId, courseId);

          const sectionIdsInPatches = new Set<string>();
          for (const patch of args.questions) {
            if (patch.exerciseSectionId === undefined || patch.exerciseSectionId === null) {
              continue;
            }

            assertValidUuid('ExerciseSection', patch.exerciseSectionId);
            sectionIdsInPatches.add(patch.exerciseSectionId);
          }

          if (sectionIdsInPatches.size > 0) {
            const sections = await getExerciseSectionsByExerciseId(args.exerciseId);
            const validIds = new Set(sections.map((section) => section.id));

            for (const sectionId of sectionIdsInPatches) {
              if (!validIds.has(sectionId)) {
                throw new AppError(
                  'That exercise section was not found on this exercise. Call get_exercise_details and use a section id from the sections array.',
                  'VALIDATION_ERROR',
                  404
                );
              }
            }
          }

          const existing = await getExercise(args.exerciseId);

          const merged = buildUpdatedQuestions(
            (existing.questions || []).map((q) => ({
              id: q.id,
              title: q.title,
              questionTypeId: q.questionTypeId,
              points: q.points,
              order: q.order,
              exerciseSectionId: q.exerciseSectionId,
              settings: q.settings,
              options: q.options
            })),
            args.questions,
            args.exerciseId
          );

          await updateExerciseService(args.exerciseId, { questions: merged });

          return {
            exerciseId: args.exerciseId,
            exerciseTitle: existing.title,
            updatedCount: merged.length
          };
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
        'Update course-level landing page fields for this course (public title, course description, overview, goals, requirements, the Description section after Requirements, instructor bio, pricing, banner image). The top-level course description field is plain text only—no HTML. All other narrative sections (overview, metadata goals/requirements, metadata description for the block after Requirements, instructor description, etc.) are HTML: paragraphs, lists, line breaks, bold, and italic only—never heading tags (h1–h6) because the UI shows section titles. Title is plain text. The courseId is automatically set — do not pass it.',
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
          const envelope = coursePlanParam.parse(args);
          const plan = CoursePlanSchema.parse(envelope.plan);
          const sectionCount = plan.sections.length;
          const itemCount = plan.sections.reduce((sum, section) => sum + section.items.length, 0);

          trackAgentEvent(AgentEvent.PLAN_GENERATED, { orgId, userId, courseId, sectionCount, itemCount });

          return plan;
        });
      }
    }),

    ask_template_questions: tool({
      description:
        'Render the canonical questionnaire card for the given course template. Pass only `templateId` — the form title and fields are pulled from the shared course-template registry on the server, so you do not (and must not) supply them. Pauses until the teacher submits via metadata.template.action submit_template_answers or skips via skip_template_form.',
      inputSchema: askTemplateQuestionsParam,
      execute: async (args) => {
        return executeAgentTool('ask_template_questions', { orgId, userId, courseId, args }, async () => {
          const template = getCourseTemplate(args.templateId);

          if (!template) {
            throw new AppError(`Unknown course template: ${args.templateId}`, 'COURSE_TEMPLATE_NOT_FOUND', 400);
          }

          return {
            awaiting_user: true as const,
            templateId: args.templateId,
            title: template.formTitle,
            fields: template.fields
          } as const;
        });
      }
    }),

    fetch_documentation_url: tool({
      description:
        'Fetch a public documentation URL via Jina Reader. Returns markdown wrapped as untrusted external content plus same-origin links for follow-up fetches.',
      inputSchema: fetchDocumentationUrlParam,
      execute: async (args) => {
        return executeAgentTool('fetch_documentation_url', { orgId, userId, courseId, args }, async () => {
          return fetchDocumentationUrl({
            url: args.url,
            orgId,
            courseId,
            priorMessages
          });
        });
      }
    })
  };
}

/**
 * Tools that can only run inside a durable `agent_run` (BullMQ worker), never
 * inline on `/agent/chat`. These are bulk-creation tools — the kind triggered
 * by a teacher-approved course plan. Each one writes a significant amount of
 * content per call and the plan-then-run path gives them retry, cancel, a
 * progress card, and resumability.
 *
 * Note that `update_lesson_content` is intentionally NOT in this set: a teacher
 * asking the chat assistant to revise one existing lesson ("make this more
 * detailed", "shorten this", "rewrite the intro") is a single targeted edit,
 * not bulk content creation. Routing it through `generate_course_plan` forced
 * the model into a planning shape that doesn't match the request and tripped
 * the final-exam schema. Single-lesson revisions run inline in chat.
 */
export const RUN_ONLY_TOOL_NAMES = new Set(['add_questions', 'create_lesson', 'create_exercise'] as const);

/**
 * Drop run-only tools from the chat-mode tool set so the model never sees their
 * schemas in `/agent/chat` and routes heavy work through the plan-then-run path.
 */
export function filterToolsForChatMode<T extends Record<string, unknown>>(tools: T): Partial<T> {
  const filtered: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(tools)) {
    if (RUN_ONLY_TOOL_NAMES.has(name as never)) continue;
    filtered[name] = value;
  }
  return filtered as Partial<T>;
}
