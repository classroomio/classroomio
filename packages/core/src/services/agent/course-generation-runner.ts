import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import { convertToModelMessages, generateText, stepCountIs } from 'ai';
import {
  createAgentRunEvent,
  getAgentRunById,
  getChatConversation,
  listAgentRunSteps,
  updateAgentRun
} from '@cio/db/queries/agent';
import { getCourseById } from '@cio/db/queries/course';
import type { TAiAgentRunStatus } from '@cio/db/types';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { AgentRole, AIProvider, MAX_STEPS_PER_ROUND, getCourseTemplate, type AgentContext } from '@cio/ai-assistant';
import { createModel, getProviderConfigForProvider } from '@cio/ai-assistant/providers';
import { buildContextMessage, buildSystemPrompt } from '@cio/ai-assistant/prompt';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID, type AgentModelId } from '@cio/utils/agent-models';
import { AppError } from '@cio/utils/errors';
import { isOrgOnPaidPlan, recordTokenUsage } from './usage';
import {
  collectDocumentIds,
  getActiveCourseTemplateId,
  getLatestImplementationPlan,
  loadDocumentsMeta,
  loadDocumentsText
} from './chat-context';
import { buildAgentTools } from './chat-tools';
import { buildModelContextMessages } from './model-context';
import { sanitizeDanglingToolCalls } from './sanitize-tool-calls';
import { listCourseSections } from '../course/section';

const MAX_WORKER_ROUNDS = 24;
/** Statuses a job may legitimately take over. Paused, canceled and completed are never claimable. */
const CLAIMABLE_RUN_STATUSES: TAiAgentRunStatus[] = ['queued', 'running', 'waiting_for_input', 'failed'];
const ROUND_CLAIM_STATUSES: TAiAgentRunStatus[] = ['queued', 'running', 'waiting_for_input'];
const FAILURE_STATUSES: TAiAgentRunStatus[] = ['queued', 'running', 'waiting_for_input'];
const RUN_LEASE_MS = 15 * 60_000;
const CONTINUE_IMPLEMENTATION_PROMPT =
  'Continue implementing the approved course plan from the durable run checkpoint. Re-read the current course structure before creating anything that might already exist.';

export interface RunAgentCourseGenerationJobInput {
  runId: string;
  bullmqJobId?: string | null;
  workerId?: string;
}

/**
 * One distinct token per job execution, including BullMQ re-deliveries of the
 * same job id. Pause, cancel and retry release `agent_run.workerId`, so a
 * worker that no longer owns the run cannot write over the newer state.
 */
function getWorkerId(input: RunAgentCourseGenerationJobInput): string {
  if (input.workerId) return input.workerId;

  const jobContext = input.bullmqJobId ?? 'no-bullmq-job';

  return `agent-course-generation:${hostname()}:${process.pid}:${jobContext}:${randomUUID()}`;
}

function getBullmqJobId(run: { executionCursor: Record<string, unknown> }): string | null {
  const bullmq = run.executionCursor.bullmq;

  if (!bullmq || typeof bullmq !== 'object') {
    return null;
  }

  const jobId = (bullmq as Record<string, unknown>).jobId;

  return typeof jobId === 'string' && jobId.length > 0 ? jobId : null;
}

function isRunLeaseActive(run: { workerId: string | null; lockedAt: string | null }): boolean {
  if (!run.workerId || !run.lockedAt) return false;

  const lockedAtMs = Date.parse(run.lockedAt);

  if (!Number.isFinite(lockedAtMs)) return false;

  return Date.now() - lockedAtMs < RUN_LEASE_MS;
}

function canClaimRun(
  run: {
    status: TAiAgentRunStatus;
    workerId: string | null;
    lockedAt: string | null;
    executionCursor: Record<string, unknown>;
  },
  bullmqJobId: string | null | undefined
): boolean {
  if (!CLAIMABLE_RUN_STATUSES.includes(run.status)) return false;

  if (bullmqJobId && getBullmqJobId(run) === bullmqJobId) return true;

  return !isRunLeaseActive(run);
}

function getErrorPayload(error: unknown): { code: string; message: string; details?: unknown } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    return { code: 'AGENT_RUN_FAILED', message: error.message, details: { stack: error.stack } };
  }

  return { code: 'AGENT_RUN_FAILED', message: String(error) };
}

function isAgentModelId(value: unknown): value is AgentModelId {
  return typeof value === 'string' && value in AGENT_MODELS;
}

function getRunModelId(executionCursor: Record<string, unknown>): AgentModelId {
  const modelId = executionCursor.modelId;

  return isAgentModelId(modelId) ? modelId : DEFAULT_PICKER_MODEL_ID;
}

function buildRunStateMessage(input: {
  phase: string;
  executionCursor: Record<string, unknown>;
  completedStepCount: number;
  failedStepCount: number;
}): string {
  return [
    'Durable course-generation run state:',
    `- phase: ${input.phase}`,
    `- execution cursor: ${JSON.stringify(input.executionCursor)}`,
    `- completed checkpointed tool calls: ${input.completedStepCount}`,
    `- failed checkpointed tool calls: ${input.failedStepCount}`,
    '- On retry, never recreate content that is already present in the current course structure or already checkpointed as completed.',
    '- Before creating sections, lessons, exercises, or questions, call get_course_structure or the relevant read tool and continue from the last missing item.'
  ].join('\n');
}

async function assertRunCanContinue(
  runId: string,
  workerId?: string
): Promise<NonNullable<Awaited<ReturnType<typeof getAgentRunById>>>> {
  const run = await getAgentRunById(runId);

  if (!run) {
    throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  if (run.status === 'completed') {
    throw new AppError('Course generation is already completed', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

  if (run.status === 'canceled' || run.cancelRequestedAt) {
    throw new AppError('Course generation was canceled', 'AGENT_RUN_CANCELED', 409);
  }

  if (run.status === 'paused') {
    throw new AppError('Course generation was paused', 'AGENT_RUN_PAUSED', 409);
  }

  if (workerId !== undefined && run.workerId !== workerId) {
    throw new AppError('Another worker took over course generation', 'AGENT_RUN_SUPERSEDED', 409);
  }

  return run;
}

async function releaseRunOwnership(runId: string, userId: string, workerId: string): Promise<void> {
  await updateAgentRun({
    runId,
    userId,
    workerId: null,
    lockedAt: null,
    expectedWorkerId: workerId
  });
}

export async function runAgentCourseGenerationJob(input: RunAgentCourseGenerationJobInput): Promise<{
  runId: string;
  status: 'completed' | 'paused' | 'canceled' | 'superseded';
  rounds: number;
}> {
  const workerId = getWorkerId(input);
  const initialRun = await assertRunCanContinue(input.runId);

  const courseOrgId = await getCourseOrganizationId(initialRun.courseId);

  if (courseOrgId !== initialRun.orgId) {
    throw new AppError('Course does not belong to this organization', 'COURSE_ORG_MISMATCH', 403);
  }

  const [course] = await getCourseById(initialRun.courseId);

  if (!course) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  const startedAt = initialRun.startedAt ?? new Date().toISOString();

  if (!canClaimRun(initialRun, input.bullmqJobId)) {
    return { runId: initialRun.id, status: 'superseded', rounds: 0 };
  }

  const claimedAt = new Date().toISOString();
  const claimedRun = await updateAgentRun({
    runId: initialRun.id,
    userId: initialRun.userId,
    status: 'running',
    phase: 'implementing',
    startedAt,
    finishedAt: null,
    workerId,
    lockedAt: claimedAt,
    lastError: null,
    expectedStatuses: [initialRun.status],
    expectedWorkerId: initialRun.workerId ?? null
  });

  if (!claimedRun) {
    return { runId: initialRun.id, status: 'superseded', rounds: 0 };
  }

  await createAgentRunEvent({
    runId: initialRun.id,
    eventType: 'run.started',
    message: 'Agent course-generation worker started',
    payload: { bullmqJobId: input.bullmqJobId ?? null, workerId }
  });

  try {
    const conversation = initialRun.conversationId
      ? await getChatConversation(initialRun.conversationId, initialRun.userId)
      : null;
    const visibleMessages = (conversation?.messages ?? []) as Array<Record<string, unknown>>;
    const documentIds = collectDocumentIds(visibleMessages);
    const [documentText, documentAssets] = await Promise.all([
      documentIds.length > 0 ? loadDocumentsText(documentIds, initialRun.userId) : Promise.resolve(undefined),
      documentIds.length > 0 ? loadDocumentsMeta(documentIds) : Promise.resolve([])
    ]);
    const existingSections = await listCourseSections(initialRun.courseId);
    const executionCursor = initialRun.executionCursor ?? {};
    const modelId = getRunModelId(executionCursor);
    const modelDescriptor = AGENT_MODELS[modelId];
    const baseProviderConfig = getProviderConfigForProvider(modelDescriptor.provider as AIProvider);

    if (!baseProviderConfig) {
      throw new AppError(`AI assistant is not configured for model "${modelId}"`, 'AI_NOT_CONFIGURED', 503);
    }

    const providerConfig = { ...baseProviderConfig, model: modelDescriptor.backendModelId };
    const agentContext: AgentContext = {
      orgId: initialRun.orgId,
      courseId: initialRun.courseId,
      courseTitle: course.title,
      courseDescription: course.description || undefined,
      userId: initialRun.userId,
      role: AgentRole.TEACHER,
      locale: 'en',
      documentText,
      documentAssets,
      existingSectionCount: existingSections.length
    };
    const approvedPlan = initialRun.approvedPlan ?? getLatestImplementationPlan(visibleMessages);
    const activeTemplateId = getActiveCourseTemplateId(visibleMessages);
    const activeTemplate = activeTemplateId ? getCourseTemplate(activeTemplateId) : undefined;
    const systemPrompt = buildSystemPrompt(agentContext);
    const contextMessageText = buildContextMessage(agentContext, {
      template: activeTemplate,
      approvedPlan
    });
    const steps = await listAgentRunSteps(initialRun.id);
    const runStateText = buildRunStateMessage({
      phase: initialRun.phase,
      executionCursor,
      completedStepCount: steps.filter((step) => step.status === 'completed').length,
      failedStepCount: steps.filter((step) => step.status === 'failed').length
    });

    const contextManaged = await buildModelContextMessages({
      conversationId: initialRun.conversationId ?? undefined,
      courseId: initialRun.courseId,
      userId: initialRun.userId,
      messages: visibleMessages as any
    });
    const convertedMessages = sanitizeDanglingToolCalls(await convertToModelMessages(contextManaged.messages as any));
    const modelMessages: any[] = [
      { role: 'user' as const, content: [{ type: 'text' as const, text: runStateText }] },
      ...(contextMessageText.length > 0
        ? [{ role: 'user' as const, content: [{ type: 'text' as const, text: contextMessageText }] }]
        : []),
      ...convertedMessages
    ];

    modelMessages.push({
      role: 'user',
      content: [{ type: 'text', text: CONTINUE_IMPLEMENTATION_PROMPT }]
    });

    const model = createModel(providerConfig);
    const isOrgPaid = await isOrgOnPaidPlan(initialRun.orgId);
    const agentTools = buildAgentTools(initialRun.orgId, initialRun.userId, initialRun.courseId, visibleMessages, {
      runId: initialRun.id,
      workerId,
      isOrgOnPaidPlan: isOrgPaid,
      documentAssets
    });

    for (let roundIndex = 0; roundIndex < MAX_WORKER_ROUNDS; roundIndex += 1) {
      const latestRun = await assertRunCanContinue(initialRun.id, workerId);
      const queuedInstructions = latestRun.queuedInstructions;

      if (queuedInstructions.length > 0) {
        const instructionText = queuedInstructions.map((instruction) => `- ${instruction.text}`).join('\n');

        modelMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: `Teacher instructions queued while this run was active:\n${instructionText}` }
          ]
        });
      }

      const roundClaimedAt = new Date().toISOString();
      const claimedRun = await updateAgentRun({
        runId: initialRun.id,
        userId: initialRun.userId,
        status: 'running',
        phase: 'implementing',
        progressPercent: Math.min(95, Math.round((roundIndex / MAX_WORKER_ROUNDS) * 100)),
        lockedAt: roundClaimedAt,
        ...(queuedInstructions.length > 0 ? { queuedInstructions: [] } : {}),
        executionCursor: {
          ...latestRun.executionCursor,
          modelId,
          workerRound: roundIndex,
          bullmqJobId: input.bullmqJobId ?? null
        },
        expectedWorkerId: workerId,
        expectedStatuses: ROUND_CLAIM_STATUSES
      });

      if (!claimedRun) {
        throw new AppError('Another worker took over course generation', 'AGENT_RUN_SUPERSEDED', 409);
      }

      if (queuedInstructions.length > 0) {
        await createAgentRunEvent({
          runId: latestRun.id,
          eventType: 'instruction.applied',
          message: 'Queued teacher instructions applied',
          payload: { count: queuedInstructions.length }
        });
      }

      const result = await generateText({
        model,
        maxRetries: 2,
        system: systemPrompt,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(MAX_STEPS_PER_ROUND)
      });

      if (result.usage) {
        await recordTokenUsage(
          initialRun.orgId,
          initialRun.userId,
          initialRun.courseId,
          {
            promptTokens: result.usage.inputTokens ?? 0,
            completionTokens: result.usage.outputTokens ?? 0,
            totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0)
          },
          providerConfig.model || providerConfig.provider
        );
      }

      modelMessages.push(...result.response.messages);

      await createAgentRunEvent({
        runId: initialRun.id,
        eventType: 'round.completed',
        message: 'Agent generation round completed',
        payload: {
          round: roundIndex + 1,
          finishReason: result.finishReason,
          stepCount: result.steps.length,
          textPreview: result.text.slice(0, 500)
        }
      });

      if (result.steps.length < MAX_STEPS_PER_ROUND) {
        const completedAt = new Date().toISOString();
        const completedRun = await updateAgentRun({
          runId: initialRun.id,
          userId: initialRun.userId,
          status: 'completed',
          phase: 'completed',
          progressPercent: 100,
          currentStepKey: null,
          finishedAt: completedAt,
          workerId: null,
          lockedAt: null,
          executionCursor: {
            ...latestRun.executionCursor,
            modelId,
            workerRound: roundIndex + 1,
            finishReason: result.finishReason,
            finalText: result.text.slice(0, 4_000)
          },
          expectedWorkerId: workerId,
          expectedStatuses: ['running']
        });

        if (!completedRun) {
          throw new AppError('Another worker took over course generation', 'AGENT_RUN_SUPERSEDED', 409);
        }

        await createAgentRunEvent({
          runId: initialRun.id,
          eventType: 'run.completed',
          message: 'Agent course-generation run completed',
          payload: { rounds: roundIndex + 1 }
        });

        return { runId: initialRun.id, status: 'completed', rounds: roundIndex + 1 };
      }

      modelMessages.push({
        role: 'user',
        content: [{ type: 'text', text: CONTINUE_IMPLEMENTATION_PROMPT }]
      });
    }

    const pausedRun = await updateAgentRun({
      runId: initialRun.id,
      userId: initialRun.userId,
      status: 'paused',
      phase: 'paused',
      currentStepKey: null,
      workerId: null,
      lockedAt: null,
      executionCursor: {
        ...initialRun.executionCursor,
        modelId,
        pauseReason: 'max_worker_rounds_reached'
      },
      expectedWorkerId: workerId,
      expectedStatuses: ['running']
    });

    if (!pausedRun) {
      throw new AppError('Another worker took over course generation', 'AGENT_RUN_SUPERSEDED', 409);
    }

    await createAgentRunEvent({
      runId: initialRun.id,
      eventType: 'run.paused',
      message: 'Run paused after reaching the worker round limit',
      payload: { maxWorkerRounds: MAX_WORKER_ROUNDS }
    });

    return { runId: initialRun.id, status: 'paused', rounds: MAX_WORKER_ROUNDS };
  } catch (error) {
    const errorPayload = getErrorPayload(error);

    if (errorPayload.code === 'AGENT_RUN_PAUSED') {
      await releaseRunOwnership(initialRun.id, initialRun.userId, workerId);

      return { runId: initialRun.id, status: 'paused', rounds: 0 };
    }

    if (errorPayload.code === 'AGENT_RUN_CANCELED') {
      await releaseRunOwnership(initialRun.id, initialRun.userId, workerId);

      return { runId: initialRun.id, status: 'canceled', rounds: 0 };
    }

    if (errorPayload.code === 'AGENT_RUN_SUPERSEDED') {
      await releaseRunOwnership(initialRun.id, initialRun.userId, workerId);

      return { runId: initialRun.id, status: 'superseded', rounds: 0 };
    }

    const failedAt = new Date().toISOString();
    const failedRun = await updateAgentRun({
      runId: initialRun.id,
      userId: initialRun.userId,
      status: 'failed',
      phase: 'failed',
      currentStepKey: null,
      workerId: null,
      lockedAt: null,
      finishedAt: failedAt,
      lastError: errorPayload,
      expectedWorkerId: workerId,
      expectedStatuses: FAILURE_STATUSES
    });

    if (!failedRun) {
      await releaseRunOwnership(initialRun.id, initialRun.userId, workerId);

      return { runId: initialRun.id, status: 'superseded', rounds: 0 };
    }

    await createAgentRunEvent({
      runId: initialRun.id,
      eventType: 'run.failed',
      message: 'Agent course-generation run failed',
      payload: { error: errorPayload }
    });

    throw error;
  }
}
