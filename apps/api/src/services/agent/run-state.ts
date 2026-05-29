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
import { AppError } from '@api/utils/errors';

const ACTIVE_RUN_STATUSES = new Set<TAiAgentRunStatus>(['queued', 'running', 'waiting_for_input', 'paused']);

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
    throw new AppError('You must be a course team member to manage agent runs', 'NOT_COURSE_TEAM_MEMBER', 403);
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
    throw new AppError('Agent run not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  if (run.orgId !== orgId) {
    throw new AppError('Agent run does not belong to this organization', 'AGENT_RUN_ORG_MISMATCH', 403);
  }

  return run;
}

async function buildAgentRunDetail(run: TAiAgentRun): Promise<AgentRunDetail> {
  const [steps, events] = await Promise.all([listAgentRunSteps(run.id), listAgentRunEvents(run.id)]);

  return { run, steps, events };
}

async function updateOwnedAgentRun(
  runId: string,
  userId: string,
  update: Omit<Parameters<typeof updateAgentRun>[0], 'runId' | 'userId'>
): Promise<TAiAgentRun> {
  const updatedRun = await updateAgentRun({ runId, userId, ...update });

  if (!updatedRun) {
    throw new AppError('Agent run not found', 'AGENT_RUN_NOT_FOUND', 404);
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

  return buildAgentRunDetail(run);
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
    throw new AppError('Completed agent runs cannot be canceled', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

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

export async function resumeAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (run.status === 'queued' || run.status === 'running') {
    return buildAgentRunDetail(run);
  }

  if (run.status === 'completed') {
    throw new AppError('Completed agent runs cannot be resumed', 'AGENT_RUN_ALREADY_COMPLETED', 409);
  }

  if (run.status === 'canceled') {
    throw new AppError('Canceled agent runs cannot be resumed', 'AGENT_RUN_CANCELED', 409);
  }

  if (run.status === 'failed') {
    throw new AppError('Failed agent runs must be retried', 'AGENT_RUN_RETRY_REQUIRED', 409);
  }

  const updatedRun = await updateOwnedAgentRun(runId, userId, {
    status: 'queued',
    cancelRequestedAt: null,
    finishedAt: null,
    workerId: null,
    lockedAt: null
  });

  await createAgentRunEvent({
    runId,
    eventType: 'run.resumed',
    message: 'Run resumed',
    payload: { previousStatus: run.status, phase: run.phase }
  });

  return buildAgentRunDetail(updatedRun);
}

export async function retryAgentRunState(runId: string, userId: string, orgId: string): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (run.status !== 'failed') {
    throw new AppError('Only failed agent runs can be retried', 'AGENT_RUN_NOT_RETRYABLE', 409);
  }

  if (run.attempt >= run.maxAttempts) {
    throw new AppError('Agent run has reached its retry limit', 'AGENT_RUN_RETRY_LIMIT_REACHED', 409);
  }

  const updatedRun = await updateOwnedAgentRun(runId, userId, {
    status: 'queued',
    attempt: run.attempt + 1,
    lastError: null,
    cancelRequestedAt: null,
    finishedAt: null,
    workerId: null,
    lockedAt: null
  });

  await createAgentRunEvent({
    runId,
    eventType: 'run.retried',
    message: 'Run queued for retry',
    payload: { previousAttempt: run.attempt, nextAttempt: updatedRun.attempt }
  });

  return buildAgentRunDetail(updatedRun);
}

export async function appendAgentRunInstructionState(
  runId: string,
  userId: string,
  orgId: string,
  text: string
): Promise<AgentRunDetail> {
  const run = await getOwnedAgentRun(runId, userId, orgId);

  if (!ACTIVE_RUN_STATUSES.has(run.status) && run.status !== 'failed') {
    throw new AppError('Agent run is no longer accepting instructions', 'AGENT_RUN_NOT_ACCEPTING_INPUT', 409);
  }

  const instruction: AgentRunInstruction = {
    id: randomUUID(),
    text,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };

  const updatedRun = await appendAgentRunInstruction(runId, userId, instruction);

  if (!updatedRun) {
    throw new AppError('Agent run not found', 'AGENT_RUN_NOT_FOUND', 404);
  }

  await createAgentRunEvent({
    runId,
    eventType: 'instruction.queued',
    message: 'Instruction queued',
    payload: { instructionId: instruction.id }
  });

  return buildAgentRunDetail(updatedRun);
}
