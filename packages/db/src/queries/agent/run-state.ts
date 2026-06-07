import { and, asc, desc, eq } from 'drizzle-orm';
import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import type {
  TAiAgentRun,
  TAiAgentRunEvent,
  TAiAgentRunStatus,
  TAiAgentRunStep,
  TNewAiAgentRun,
  TNewAiAgentRunEvent,
  TNewAiAgentRunStep
} from '@db/types';

export interface AgentRunInstruction {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateAgentRunInput {
  orgId: string;
  courseId: string;
  conversationId?: string | null;
  userId: string;
  phase?: string;
  approvedPlan?: Record<string, unknown> | null;
  executionCursor?: Record<string, unknown>;
  sourceIds?: string[];
  modelSummary?: string;
}

export interface UpdateAgentRunInput {
  runId: string;
  userId: string;
  status?: TAiAgentRunStatus;
  phase?: string;
  progressPercent?: number;
  currentStepKey?: string | null;
  approvedPlan?: Record<string, unknown> | null;
  executionCursor?: Record<string, unknown>;
  sourceIds?: string[];
  modelSummary?: string;
  queuedInstructions?: AgentRunInstruction[];
  lastError?: { code: string; message: string; details?: unknown } | null;
  attempt?: number;
  workerId?: string | null;
  lockedAt?: string | null;
  cancelRequestedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface UpsertAgentRunStepInput {
  runId: string;
  stepKey: string;
  stepType: string;
  status?: TAiAgentRunStatus;
  inputHash?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  outputIds?: string[];
  idempotencyKey?: string | null;
  error?: { code: string; message: string; details?: unknown } | null;
  attempt?: number;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CreateAgentRunEventInput {
  runId: string;
  eventType: string;
  message?: string | null;
  payload?: Record<string, unknown> | null;
}

function hasInputKey<T extends object>(input: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export async function createAgentRun(input: CreateAgentRunInput): Promise<TAiAgentRun> {
  try {
    const values: TNewAiAgentRun = {
      orgId: input.orgId,
      courseId: input.courseId,
      conversationId: input.conversationId ?? null,
      userId: input.userId,
      phase: input.phase ?? 'planning',
      approvedPlan: input.approvedPlan ?? null,
      executionCursor: input.executionCursor ?? {},
      sourceIds: input.sourceIds ?? [],
      modelSummary: input.modelSummary ?? '',
      queuedInstructions: []
    };

    const [row] = await db.insert(schema.aiAgentRun).values(values).returning();

    if (!row) {
      throw new Error('Insert returned no row');
    }

    return row;
  } catch (error) {
    console.error('createAgentRun error:', error);
    throw new Error('Failed to create agent run');
  }
}

export async function listAgentRuns(courseId: string, userId: string): Promise<TAiAgentRun[]> {
  try {
    return await db
      .select()
      .from(schema.aiAgentRun)
      .where(and(eq(schema.aiAgentRun.courseId, courseId), eq(schema.aiAgentRun.userId, userId)))
      .orderBy(desc(schema.aiAgentRun.updatedAt));
  } catch (error) {
    console.error('listAgentRuns error:', error);
    throw new Error('Failed to list agent runs');
  }
}

export async function getAgentRun(runId: string, userId: string): Promise<TAiAgentRun | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.aiAgentRun)
      .where(and(eq(schema.aiAgentRun.id, runId), eq(schema.aiAgentRun.userId, userId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getAgentRun error:', error);
    throw new Error('Failed to get agent run');
  }
}

export async function getAgentRunById(runId: string): Promise<TAiAgentRun | null> {
  try {
    const [row] = await db.select().from(schema.aiAgentRun).where(eq(schema.aiAgentRun.id, runId)).limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getAgentRunById error:', error);
    throw new Error('Failed to get agent run by id');
  }
}

export async function updateAgentRun(input: UpdateAgentRunInput): Promise<TAiAgentRun | null> {
  try {
    const updateData: Partial<TNewAiAgentRun> = {
      updatedAt: new Date().toISOString()
    };

    if (hasInputKey(input, 'status')) updateData.status = input.status;
    if (hasInputKey(input, 'phase')) updateData.phase = input.phase;
    if (hasInputKey(input, 'progressPercent')) updateData.progressPercent = input.progressPercent;
    if (hasInputKey(input, 'currentStepKey')) updateData.currentStepKey = input.currentStepKey;
    if (hasInputKey(input, 'approvedPlan')) updateData.approvedPlan = input.approvedPlan;
    if (hasInputKey(input, 'executionCursor')) updateData.executionCursor = input.executionCursor;
    if (hasInputKey(input, 'sourceIds')) updateData.sourceIds = input.sourceIds;
    if (hasInputKey(input, 'modelSummary')) updateData.modelSummary = input.modelSummary;
    if (hasInputKey(input, 'queuedInstructions')) updateData.queuedInstructions = input.queuedInstructions;
    if (hasInputKey(input, 'lastError')) updateData.lastError = input.lastError;
    if (hasInputKey(input, 'attempt')) updateData.attempt = input.attempt;
    if (hasInputKey(input, 'workerId')) updateData.workerId = input.workerId;
    if (hasInputKey(input, 'lockedAt')) updateData.lockedAt = input.lockedAt;
    if (hasInputKey(input, 'cancelRequestedAt')) updateData.cancelRequestedAt = input.cancelRequestedAt;
    if (hasInputKey(input, 'startedAt')) updateData.startedAt = input.startedAt;
    if (hasInputKey(input, 'finishedAt')) updateData.finishedAt = input.finishedAt;

    const [row] = await db
      .update(schema.aiAgentRun)
      .set(updateData)
      .where(and(eq(schema.aiAgentRun.id, input.runId), eq(schema.aiAgentRun.userId, input.userId)))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('updateAgentRun error:', error);
    throw new Error('Failed to update agent run');
  }
}

export async function appendAgentRunInstruction(
  runId: string,
  userId: string,
  instruction: AgentRunInstruction
): Promise<TAiAgentRun | null> {
  try {
    const existingRun = await getAgentRun(runId, userId);
    if (!existingRun) return null;

    return await updateAgentRun({
      runId,
      userId,
      queuedInstructions: [...(existingRun.queuedInstructions ?? []), instruction]
    });
  } catch (error) {
    console.error('appendAgentRunInstruction error:', error);
    throw new Error('Failed to append agent run instruction');
  }
}

export async function upsertAgentRunStep(input: UpsertAgentRunStepInput): Promise<TAiAgentRunStep> {
  try {
    const now = new Date().toISOString();
    const values: TNewAiAgentRunStep = {
      runId: input.runId,
      stepKey: input.stepKey,
      stepType: input.stepType,
      status: input.status ?? 'queued',
      inputHash: input.inputHash ?? null,
      input: input.input ?? null,
      output: input.output ?? null,
      outputIds: input.outputIds ?? [],
      idempotencyKey: input.idempotencyKey ?? null,
      error: input.error ?? null,
      attempt: input.attempt ?? 0,
      startedAt: input.startedAt ?? null,
      finishedAt: input.finishedAt ?? null
    };

    const [row] = await db
      .insert(schema.aiAgentRunStep)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.aiAgentRunStep.runId, schema.aiAgentRunStep.stepKey],
        set: {
          stepType: input.stepType,
          status: input.status ?? 'queued',
          inputHash: input.inputHash ?? null,
          input: input.input ?? null,
          output: input.output ?? null,
          outputIds: input.outputIds ?? [],
          idempotencyKey: input.idempotencyKey ?? null,
          error: input.error ?? null,
          attempt: input.attempt ?? 0,
          startedAt: input.startedAt ?? null,
          finishedAt: input.finishedAt ?? null,
          updatedAt: now
        }
      })
      .returning();

    if (!row) {
      throw new Error('Upsert returned no row');
    }

    return row;
  } catch (error) {
    console.error('upsertAgentRunStep error:', error);
    throw new Error('Failed to upsert agent run step');
  }
}

export async function getAgentRunStep(runId: string, stepKey: string): Promise<TAiAgentRunStep | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.aiAgentRunStep)
      .where(and(eq(schema.aiAgentRunStep.runId, runId), eq(schema.aiAgentRunStep.stepKey, stepKey)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getAgentRunStep error:', error);
    throw new Error('Failed to get agent run step');
  }
}

export async function listAgentRunSteps(runId: string): Promise<TAiAgentRunStep[]> {
  try {
    return await db
      .select()
      .from(schema.aiAgentRunStep)
      .where(eq(schema.aiAgentRunStep.runId, runId))
      .orderBy(asc(schema.aiAgentRunStep.createdAt));
  } catch (error) {
    console.error('listAgentRunSteps error:', error);
    throw new Error('Failed to list agent run steps');
  }
}

export async function createAgentRunEvent(input: CreateAgentRunEventInput): Promise<TAiAgentRunEvent> {
  try {
    const values: TNewAiAgentRunEvent = {
      runId: input.runId,
      eventType: input.eventType,
      message: input.message ?? null,
      payload: input.payload ?? null
    };

    const [row] = await db.insert(schema.aiAgentRunEvent).values(values).returning();

    if (!row) {
      throw new Error('Insert returned no row');
    }

    return row;
  } catch (error) {
    console.error('createAgentRunEvent error:', error);
    throw new Error('Failed to create agent run event');
  }
}

export async function listAgentRunEvents(runId: string, limit = 100): Promise<TAiAgentRunEvent[]> {
  try {
    return await db
      .select()
      .from(schema.aiAgentRunEvent)
      .where(eq(schema.aiAgentRunEvent.runId, runId))
      .orderBy(asc(schema.aiAgentRunEvent.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listAgentRunEvents error:', error);
    throw new Error('Failed to list agent run events');
  }
}
