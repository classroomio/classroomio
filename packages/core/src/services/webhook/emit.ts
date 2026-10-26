import { getOrganizationById } from '@cio/db/queries/organization';
import {
  insertWebhookEventWithDeliveries,
  listActiveEndpointsForEvent,
  orgHasActiveWebhookEndpoint
} from '@cio/db/queries/webhook';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TGroupmember } from '@cio/db/types';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { WEBHOOK_API_VERSION, type TWebhookEventType } from '@cio/utils/constants/webhook';
import type { TCourseWebhookEventType, TWebhookEventInput } from '@cio/utils/validation/webhook';

import { createWebhookRecordId } from './deliver';
import {
  readCachedCourseOrganizationId,
  readOrgHasWebhookEndpoints,
  writeCachedCourseOrganizationId,
  writeOrgHasWebhookEndpoints
} from './endpoint-cache';
import { enrichWebhookEventData } from './enrich';
import { hasWebhookEntitlement } from './entitlement';

export type TWebhookEventEnvelope = {
  id: string;
  type: string;
  createdAt: string;
  apiVersion: string;
  organization: { id: string; name: string | null; siteName: string | null };
  data: Record<string, unknown>;
};

export async function buildWebhookEnvelope(
  organizationId: string,
  eventType: string,
  data: Record<string, unknown>,
  occurredAt: string = new Date().toISOString()
): Promise<TWebhookEventEnvelope> {
  const organization = await getOrganizationById(organizationId);

  return {
    id: createWebhookRecordId('evt'),
    type: eventType,
    createdAt: occurredAt,
    apiVersion: WEBHOOK_API_VERSION,
    organization: { id: organizationId, name: organization?.name ?? null, siteName: organization?.siteName ?? null },
    data
  };
}

const MAX_CONCURRENT_EMITS = 5;
const pendingEmits: Array<() => Promise<void>> = [];
let runningEmits = 0;

function drainPendingEmits(): void {
  while (runningEmits < MAX_CONCURRENT_EMITS && pendingEmits.length > 0) {
    const task = pendingEmits.shift()!;
    runningEmits += 1;

    void task().finally(() => {
      runningEmits -= 1;
      drainPendingEmits();
    });
  }
}

function scheduleEmit(task: () => Promise<void>): void {
  pendingEmits.push(task);
  drainPendingEmits();
}

async function orgHasWebhookEndpoints(organizationId: string): Promise<boolean> {
  const cached = await readOrgHasWebhookEndpoints(organizationId);

  if (cached !== null) return cached;

  const hasEndpoints = await orgHasActiveWebhookEndpoint(organizationId);
  await writeOrgHasWebhookEndpoints(organizationId, hasEndpoints);

  return hasEndpoints;
}

async function resolveCourseOrganizationId(courseId: string): Promise<string | null> {
  const cached = await readCachedCourseOrganizationId(courseId);

  if (cached) return cached;

  const organizationId = await getCourseOrganizationId(courseId);

  if (organizationId) {
    await writeCachedCourseOrganizationId(courseId, organizationId);
  }

  return organizationId;
}

/**
 * Records the event for every subscribed endpoint and schedules delivery, and resolves once that is done.
 * Never throws: a webhook failure must not fail the action that triggered it.
 */
export async function recordWebhookEvent<TEvent extends TWebhookEventType>(
  organizationId: string,
  eventType: TEvent,
  data: TWebhookEventInput<TEvent>,
  occurredAt: string = new Date().toISOString()
): Promise<void> {
  try {
    if (!(await orgHasWebhookEndpoints(organizationId))) return;

    const endpoints = await listActiveEndpointsForEvent(organizationId, eventType);

    if (endpoints.length === 0) return;

    if (!(await hasWebhookEntitlement(organizationId))) return;

    const detailedData = await enrichWebhookEventData(organizationId, eventType, data);
    const envelope = await buildWebhookEnvelope(organizationId, eventType, detailedData, occurredAt);
    const now = new Date().toISOString();
    const deliveries = await insertWebhookEventWithDeliveries(
      { id: envelope.id, organizationId, eventType, payload: envelope },
      endpoints.map((endpoint) => ({
        id: createWebhookRecordId('whd'),
        webhookId: endpoint.id,
        nextAttemptAt: now
      }))
    );

    await Promise.all(deliveries.map((delivery) => enqueueWebhookDelivery({ webhookId: delivery.webhookId })));
  } catch (error) {
    console.error('recordWebhookEvent error:', { eventType, organizationId, error });
  }
}

/**
 * Resolves the course's organization and records the event with `courseId` merged into the data,
 * and resolves once that is done. Never throws.
 */
export async function recordCourseWebhookEvent<TEvent extends TCourseWebhookEventType>(
  courseId: string,
  eventType: TEvent,
  data: Omit<TWebhookEventInput<TEvent>, 'courseId'>,
  occurredAt: string = new Date().toISOString()
): Promise<void> {
  try {
    const organizationId = await resolveCourseOrganizationId(courseId);

    if (!organizationId) return;

    await recordWebhookEvent(
      organizationId,
      eventType,
      { courseId, ...data } as TWebhookEventInput<TEvent>,
      occurredAt
    );
  } catch (error) {
    console.error('recordCourseWebhookEvent error:', { eventType, courseId, error });
  }
}

/**
 * Queues the event to be recorded in the background and returns immediately, so the caller's request
 * never waits on webhook work. At most a few events are recorded at a time.
 */
export async function emitWebhookEvent<TEvent extends TWebhookEventType>(
  organizationId: string,
  eventType: TEvent,
  data: TWebhookEventInput<TEvent>
): Promise<void> {
  const occurredAt = new Date().toISOString();

  scheduleEmit(() => recordWebhookEvent(organizationId, eventType, data, occurredAt));
}

/**
 * Same as `emitWebhookEvent`, resolving the organization from the course in the background.
 */
export async function emitCourseWebhookEvent<TEvent extends TCourseWebhookEventType>(
  courseId: string,
  eventType: TEvent,
  data: Omit<TWebhookEventInput<TEvent>, 'courseId'>
): Promise<void> {
  const occurredAt = new Date().toISOString();

  scheduleEmit(() => recordCourseWebhookEvent(courseId, eventType, data, occurredAt));
}

export type TWebhookMemberSource = TWebhookEventInput<'course.member.added'>['source'];

/**
 * Builds the `source` of a membership: how the person got into the course. Fields that do not apply are `null`.
 */
export function buildMemberSource(
  method: TWebhookMemberSource['method'],
  ids: Partial<Omit<TWebhookMemberSource, 'method'>> = {}
): TWebhookMemberSource {
  return {
    method,
    inviteId: ids.inviteId ?? null,
    inviteLinkId: ids.inviteLinkId ?? null,
    cohortId: ids.cohortId ?? null,
    programId: ids.programId ?? null,
    apiKeyId: ids.apiKeyId ?? null
  };
}

export async function emitCourseMemberAddedWebhookEvent(
  courseId: string,
  member: TGroupmember,
  context: { source: TWebhookMemberSource; actorProfileId?: string | null }
): Promise<void> {
  await emitCourseWebhookEvent(courseId, 'course.member.added', {
    memberId: member.id,
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId,
    enrolledAt: member.createdAt,
    source: context.source,
    actorProfileId: context.actorProfileId ?? null
  });
}

export async function emitCourseMemberRemovedWebhookEvent(
  courseId: string,
  member: TGroupmember,
  context: {
    actorProfileId?: string | null;
    reason?: string | null;
    progressAtRemoval?: TWebhookEventInput<'course.member.removed'>['progressAtRemoval'];
  }
): Promise<void> {
  await emitCourseWebhookEvent(courseId, 'course.member.removed', {
    memberId: member.id,
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId,
    enrolledAt: member.createdAt,
    actorProfileId: context.actorProfileId ?? null,
    reason: context.reason ?? null,
    progressAtRemoval: context.progressAtRemoval ?? null
  });
}

export type TOrganizationMemberWebhookRef = {
  id: number;
  profileId: string | null;
  email: string | null;
  roleId: number;
  status?: string | null;
};

export async function emitOrganizationMemberWebhookEvent(
  eventType: 'organization.member.added' | 'organization.member.removed',
  organizationId: string,
  member: TOrganizationMemberWebhookRef,
  actorProfileId: string | null = null
): Promise<void> {
  await emitWebhookEvent(organizationId, eventType, {
    memberId: String(member.id),
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId,
    status: member.status ?? null,
    actorProfileId
  });
}

export async function emitOrganizationMemberUpdatedWebhookEvent(
  organizationId: string,
  member: TOrganizationMemberWebhookRef,
  changes: TWebhookEventInput<'organization.member.updated'>['changes'],
  actorProfileId: string | null = null
): Promise<void> {
  await emitWebhookEvent(organizationId, 'organization.member.updated', {
    memberId: String(member.id),
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId,
    status: member.status ?? null,
    actorProfileId,
    changes
  });
}

export async function emitCoursePublishWebhookEvent(
  courseId: string,
  publishChange: 'published' | 'unpublished' | null | undefined,
  actorProfileId: string | null = null
): Promise<void> {
  if (!publishChange) return;

  await emitCourseWebhookEvent(courseId, publishChange === 'published' ? 'course.published' : 'course.unpublished', {
    actorProfileId
  });
}

export async function emitCohortMemberWebhookEvent(
  eventType: 'cohort.member.added' | 'cohort.member.removed',
  organizationId: string,
  cohortId: string,
  member: { id: string; profileId: string | null; email: string | null; roleId: number },
  actorProfileId: string | null = null
): Promise<void> {
  await emitWebhookEvent(organizationId, eventType, {
    cohortId,
    memberId: member.id,
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId,
    actorProfileId
  });
}
