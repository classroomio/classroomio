import { randomUUID } from 'node:crypto';

import {
  appendAgentRunInstruction,
  createAgentRun,
  createAgentRunEvent,
  getAgentRun,
  getChatConversation,
  listAgentRunEvents,
  listAgentRuns,
  listAgentRunSteps,
  updateAgentRun,
  type AgentRunInstruction
} from '@cio/db/queries/agent';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TAiAgentRun, TAiAgentRunEvent, TAiAgentRunStatus, TAiAgentRunStep } from '@cio/db/types';
import { QUEUE_NAMES, enqueueAgentCourseGenerationRun, getQueue, isRedisConfigured, toJobId } from '@cio/jobs';
import { AppError } from '@api/utils/errors';

const ACTIVE_RUN_STATUSES = new Set<TAiAgentRunStatus>(['queued', 'running', 'waiting_for_input', 'paused']);
const PAUSABLE_RUN_STATUSES: TAiAgentRunStatus[] = ['queued', 'running', 'waiting_for_input'];
const RESUME_TRANSITION_STATUSES: TAiAgentRunStatus[] = ['paused', 'waiting_for_input'];
const QUEUE_HEALTH_TIMEOUT_MS = 2_000;

export interface CreateAgentRunStateInput {
  orgId: string;
  userId: string;
  courseId: string;
  conversationId?: string;
  phase?: string;
  approvedPlan?: Record<string, unknown>;
  executionCursor?: Record<string, unknown>;
  sourceIds?: string[];
  modelSummary?: string;
  modelId?: string;
}

export interface AgentRunDetail {
  run: TAiAgentRun;
  steps: TAiAgentRunStep[];
  events: TAiAgentRunEvent[];
  queueHealth: AgentRunQueueHealth | null;
}

export type AgentRunQueueHealthState =
  | 'active'
  | 'waiting'
  | 'delayed'
  | 'completed'
  | 'failed'
  | 'missing'
  | 'unavailable';

export interface AgentRunQueueHealth {
  state: AgentRunQueueHealthState;
  /** How many jobs the queue is processing right now, across every run. */
  activeJobs: number;
}

async function assertCourseRunAccess(courseId: string, userId: string, orgId: string): Promise<void> {
  const courseOrgId = await getCourseOrganizationId(courseId);

  if (!courseOrgId) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  if (courseOrgId !== orgId) {
    throw new AppError('Course does not belong to this organization', 'COURSE_ORG_MISMATCH', 403);
  }

  const hasCourseAccess = await isCourseTeamMemberOrOrgAdmin(courseId, userId);

  if (!hasCourseAccess) {
    throw new AppError('You must be a course team member to manage course generation', 'NOT_COURSE_TEAM_MEMBER', 403);
  }
}

async function assertConversationBelongsToCourse(
  conversationId: string | undefined,
  courseId: string,
  userId: string
): Promise<void> {
  if (!conversationId) return;

  const conversation = await getChatConversation(conversationId, userId);

  if (!conversation || conversation.courseId !== courseId) {
    throw new AppError('Conversation not found for this course', 'CONVERSATION_NOT_FOUND', 404);
  }
}

async function getOwnedAgentRun(runId: string, userId: string, orgId: string): Promise<TAiAgentRun> {
  const run = await getAgentRun(runId, userId);

  if (!run) {
    throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  if (run.orgId !== orgId) {
    throw new AppError('This course generation does not belong to this organization', 'AGENT_RUN_ORG_MISMATCH', 403);
  }

  return run;
}

async function buildAgentRunDetail(run: TAiAgentRun): Promise<AgentRunDetail> {
  const [steps, events, queueHealth] = await Promise.all([
    listAgentRunSteps(run.id),
    listAgentRunEvents(run.id),
    getRunQueueHealth(run)
  ]);

  return { run, steps, events, queueHealth };
}

function getBullmqJobId(run: TAiAgentRun): string | null {
  const bullmq = run.executionCursor.bullmq;

  if (!bullmq || typeof bullmq !== 'object') {
    return null;
  }

  const jobId = (bullmq as Record<string, unknown>).jobId;

  return typeof jobId === 'string' && jobId.length > 0 ? jobId : null;
}

function toQueueHealthState(jobState: string): AgentRunQueueHealthState {
  switch (jobState) {
    case 'active':
      return 'active';
    case 'delayed':
      return 'delayed';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'unknown':
      return 'missing';
    default:
      return 'waiting';
  }
}

async function withDeadline<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Queue health check timed out')), timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getExecutionKey(run: TAiAgentRun): string {
  const bullmq = run.executionCursor.bullmq;

  if (!bullmq || typeof bullmq !== 'object') {
    return run.updatedAt;
  }

  const executionKey = (bullmq as Record<string, unknown>).executionKey;

  return typeof executionKey === 'string' && executionKey.length > 0 ? executionKey : run.updatedAt;
}

async function readRunQueueHealth(run: TAiAgentRun, jobId: string | null): Promise<AgentRunQueueHealth> {
  const queue = getQueue(QUEUE_NAMES.agentCourseGeneration);
  const counts = await queue.getJobCounts('active');
  const activeJobs = counts.active ?? 0;

  if (!jobId) {
    return { state: 'missing', activeJobs };
  }

  const job = await queue.getJob(jobId);

  if (!job) {
    return { state: 'missing', activeJobs };
  }

  const jobState = await job.getState();

  return { state: toQueueHealthState(jobState), activeJobs };
}

/**
 * Where the run's current BullMQ job actually is. Answers "is the worker
 * healthy?" with queue data instead of inferring it from a timestamp. Returns
 * null unless the run is queued, so healthy/running polls cost no Redis calls.
 */
async function getRunQueueHealth(run: TAiAgentRun): Promise<AgentRunQueueHealth | null> {
  if (run.status !== 'queued') return null;

  if (!isRedisConfigured()) {
    return { state: 'unavailable', activeJobs: 0 };
  }

  const jobId = getBullmqJobId(run);

  try {
    return await withDeadline(readRunQueueHealth(run, jobId), QUEUE_HEALTH_TIMEOUT_MS);
  } catch (error) {
    console.error('getRunQueueHealth error:', error);

    return { state: 'unavailable', activeJobs: 0 };
  }
}

async function removeQueuedBullmqJob(run: TAiAgentRun): Promise<void> {
  if (!isRedisConfigured()) return;

  const jobId = getBullmqJobId(run);

  if (!jobId) return;

  try {
    const removed = await getQueue(QUEUE_NAMES.agentCourseGeneration).remove(jobId);

    await createAgentRunEvent({
      runId: run.id,
      eventType: 'run.queue_cancel_checked',
      message: removed === 1 ? 'Queued BullMQ job removed' : 'BullMQ job was already active or missing',
      payload: { jobId, removed }
    });
  } catch (error) {
    await createAgentRunEvent({
      runId: run.id,
      eventType: 'run.queue_cancel_failed',
      message: 'Could not remove queued BullMQ job; worker will stop at the next checkpoint',
      payload: { jobId, error: error instanceof Error ? error.message : String(error) }
    });
  }
}

async function enqueueAgentRun(
  run: TAiAgentRun,
  reason: 'created' | 'resumed' | 'retried',
  executionKey?: string
): Promise<TAiAgentRun> {
  if (!isRedisConfigured()) {
    const message = 'Course generation is unavailable because the background queue is not configured.';
    const failedAt = new Date().toISOString();
    const failedRun = await updateOwnedAgentRun(run.id, run.userId, {
      status: 'failed',
      phase: 'failed',
      lastError: { code: 'AGENT_RUN_QUEUE_UNAVAILABLE', message },
      finishedAt: failedAt,
      workerId: null,
      lockedAt: null
    });

    await createAgentRunEvent({
      runId: run.id,
      eventType: 'run.enqueue_skipped',
      message: 'Redis is not configured; the run was marked failed instead of staying queued',
      payload: { reason, error: { code: 'AGENT_RUN_QUEUE_UNAVAILABLE', message } }
    });

    return failedRun;
  }

  const jobExecutionKey = executionKey ?? randomUUID();
  // Compute the deterministic job ID up front so the cursor can be written
  // before the BullMQ job is added. A worker that starts immediately can then
  // match it in canClaimRun instead of racing a missing cursor entry.
  const jobId = toJobId(run.id, run.attempt, jobExecutionKey);
  const enqueuedAt = new Date().toISOString();

  // Write the cursor with the deterministic job ID before adding the job.
  // Guard against a newer execution having already taken over this run.
  const cursorRun = await updateAgentRun({
    runId: run.id,
    userId: run.userId,
    status: 'queued',
    executionCursor: {
      ...run.executionCursor,
      bullmq: {
        queue: 'agent-course-generation',
        jobId,
        executionKey: jobExecutionKey,
        enqueuedAt,
        reason
      }
    },
    expectedStatuses: ['queued']
  });

  if (!cursorRun) {
    const currentRun = await getAgentRun(run.id, run.userId);
    return currentRun ?? run;
  }

  try {
    await enqueueAgentCourseGenerationRun(
      {
        runId: run.id,
        requestedByUserId: run.userId,
        organizationId: run.orgId
      },
      { attempt: run.attempt, executionKey: jobExecutionKey }
    );

    await createAgentRunEvent({
      runId: run.id,
      eventType: 'run.enqueued',
      message: 'Run enqueued for background course generation',
      payload: { jobId, reason }
    });

    return cursorRun;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start course generation';
    const failedAt = new Date().toISOString();
    // Only mark this run failed / clear ownership when it is still in the state
    // this enqueue attempt wrote. A pause or resume may already have started a
    // newer execution; in that case preserve its state and worker ownership.
    const updatedRun = await updateAgentRun({
      runId: run.id,
      userId: run.userId,
      status: 'failed',
      phase: 'failed',
      lastError: { code: 'AGENT_RUN_ENQUEUE_FAILED', message },
      finishedAt: failedAt,
      workerId: null,
      lockedAt: null,
      expectedStatuses: [run.status],
      expectedWorkerId: run.workerId ?? null
    });

    if (!updatedRun) {
      // A newer execution already took over this run; do not clobber its state.
      const currentRun = await getAgentRun(run.id, run.userId);
      return currentRun ?? run;
    }

    await createAgentRunEvent({
      runId: run.id,
      eventType: 'run.enqueue_failed',
      message: 'Failed to enqueue background course generation',
      payload: { reason, error: { code: 'AGENT_RUN_ENQUEUE_FAILED', message } }
    });

    throw new AppError(message, 'AGENT_RUN_ENQUEUE_FAILED', 500);
  }
}

async function updateOwnedAgentRun(
  runId: string,
  userId: string,
  update: Omit<Parameters<typeof updateAgentRun>[0], 'runId' | 'userId'>
): Promise<TAiAgentRun> {
  const updatedRun = await updateAgentRun({ runId, userId, ...update });

  if (!updatedRun) {
    throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  return updatedRun;
}

export async function createAgentRunState(input: CreateAgentRunStateInput): Promise<AgentRunDetail> {
  await assertCourseRunAccess(input.courseId, input.userId, input.orgId);
  await assertConversationBelongsToCourse(input.conversationId, input.courseId, input.userId);

  const executionCursor = {
    ...(input.executionCursor ?? {}),
    ...(input.modelId ? { modelId: input.modelId } : {})
  };

  const run = await createAgentRun({
    orgId: input.orgId,
    courseId: input.courseId,
    conversationId: input.conversationId,
    userId: input.userId,
    phase: input.phase,
    approvedPlan: input.approvedPlan ?? null,
    executionCursor,
    sourceIds: input.sourceIds,
    modelSummary: input.modelSummary
  });

  await createAgentRunEvent({
    runId: run.id,
    eventType: 'run.created',
    message: 'Agent run created',
    payload: { phase: run.phase, status: run.status }
  });

  const enqueuedRun = await enqueueAgentRun(run, 'created');

  return buildAgentRunDetail(enqueuedRun);
}

export async function listAgentRunStates(courseId: string, userId: string, orgId: string): Promise<TAiAgentRun[]> {
  await assertCourseRunAccess(courseId, userId, orgId);

  return listAgentRuns(courseId, userId);
}

export async function getAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  return buildAgentRunDetail(run);
}

export async function cancelAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (run.status === 'canceled') {
    return buildAgentRunDetail(run);
  }

  if (run.status === 'completed') {
    throw new AppError('Completed course generation cannot be canceled', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

  await removeQueuedBullmqJob(run);

  const now = new Date().toISOString();
  const updatedRun = await updateOwnedAgentRun(runId, userId, {
    status: 'canceled',
    phase: 'canceled',
    cancelRequestedAt: now,
    finishedAt: now,
    workerId: null,
    lockedAt: null
  });

  await createAgentRunEvent({
    runId,
    eventType: 'run.canceled',
    message: 'Cancel requested',
    payload: { previousStatus: run.status, previousPhase: run.phase }
  });

  return buildAgentRunDetail(updatedRun);
}

export async function pauseAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (run.status === 'paused') {
    return buildAgentRunDetail(run);
  }

  if (run.status === 'completed') {
    throw new AppError('Completed course generation cannot be paused', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

  if (run.status === 'canceled') {
    throw new AppError('Canceled course generation cannot be paused', 'AGENT_RUN_ALREADY_CANCELED', 409);
  }

  if (run.status === 'failed') {
    throw new AppError('Failed course generation cannot be paused', 'AGENT_RUN_FAILED', 409);
  }

  await removeQueuedBullmqJob(run);

  const pausedRun = await updateAgentRun({
    runId,
    userId,
    status: 'paused',
    phase: 'paused',
    currentStepKey: null,
    expectedStatuses: PAUSABLE_RUN_STATUSES
  });

  if (!pausedRun) {
    const currentRun = await getAgentRun(runId, userId);

    if (!currentRun) {
      throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
    }

    return buildAgentRunDetail(currentRun);
  }

  await createAgentRunEvent({
    runId,
    eventType: 'run.paused',
    message: 'Course generation paused',
    payload: { previousStatus: run.status, previousPhase: run.phase }
  });

  return buildAgentRunDetail(pausedRun);
}

export async function resumeAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (run.status === 'running') {
    return buildAgentRunDetail(run);
  }

  if (run.status === 'queued') {
    await removeQueuedBullmqJob(run);

    const enqueuedRun = await enqueueAgentRun(run, 'resumed', getExecutionKey(run));

    return buildAgentRunDetail(enqueuedRun);
  }

  if (run.status === 'completed') {
    throw new AppError('Completed course generation cannot be resumed', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

  if (run.status === 'canceled') {
    throw new AppError('Canceled course generation cannot be resumed', 'AGENT_RUN_CANCELED', 409);
  }

  if (run.status === 'failed') {
    throw new AppError('Failed course generation must be retried', 'AGENT_RUN_RETRY_REQUIRED', 409);
  }

  const executionKey = randomUUID();
  const updatedRun = await updateAgentRun({
    runId,
    userId,
    status: 'queued',
    phase: 'implementing',
    cancelRequestedAt: null,
    finishedAt: null,
    lastError: null,
    expectedStatuses: RESUME_TRANSITION_STATUSES,
    expectedWorkerId: run.workerId ?? null
  });

  if (!updatedRun) {
    const currentRun = await getAgentRun(runId, userId);

    if (!currentRun) {
      throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
    }

    return buildAgentRunDetail(currentRun);
  }

  await createAgentRunEvent({
    runId,
    eventType: 'run.resumed',
    message: 'Run resumed',
    payload: { previousStatus: run.status, phase: run.phase }
  });

  const enqueuedRun = await enqueueAgentRun(updatedRun, 'resumed', executionKey);

  return buildAgentRunDetail(enqueuedRun);
}

export async function retryAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (ACTIVE_RUN_STATUSES.has(run.status)) {
    return buildAgentRunDetail(run);
  }

  if (run.status !== 'failed') {
    throw new AppError('Only failed course generation can be retried', 'AGENT_RUN_NOT_RETRYABLE', 409);
  }

  if (run.attempt >= run.maxAttempts) {
    throw new AppError('Course generation has reached its retry limit', 'AGENT_RUN_RETRY_LIMIT_REACHED', 409);
  }

  const executionKey = randomUUID();
  const updatedRun = await updateAgentRun({
    runId,
    userId,
    status: 'queued',
    attempt: run.attempt + 1,
    lastError: null,
    cancelRequestedAt: null,
    finishedAt: null,
    workerId: null,
    lockedAt: null,
    expectedStatuses: ['failed'],
    expectedWorkerId: null
  });

  if (!updatedRun) {
    const currentRun = await getAgentRun(runId, userId);

    if (!currentRun) {
      throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
    }

    return buildAgentRunDetail(currentRun);
  }

  await createAgentRunEvent({
    runId,
    eventType: 'run.retried',
    message: 'Run queued for retry',
    payload: { previousAttempt: run.attempt, nextAttempt: updatedRun.attempt }
  });

  const enqueuedRun = await enqueueAgentRun(updatedRun, 'retried', executionKey);

  return buildAgentRunDetail(enqueuedRun);
}

export async function appendAgentRunInstructionState(
  runId: string,
  userId: string,
  orgId: string,
  text: string
): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (!ACTIVE_RUN_STATUSES.has(run.status) && run.status !== 'failed') {
    throw new AppError('Course generation is no longer accepting instructions', 'AGENT_RUN_NOT_ACCEPTING_INPUT', 409);
  }

  const instruction: AgentRunInstruction = {
    id: randomUUID(),
    text,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };

  const updatedRun = await appendAgentRunInstruction(runId, userId, instruction);

  if (!updatedRun) {
    throw new AppError('Course generation not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  await createAgentRunEvent({
    runId,
    eventType: 'instruction.queued',
    message: 'Instruction queued',
    payload: { instructionId: instruction.id }
  });

  return buildAgentRunDetail(updatedRun);
}
