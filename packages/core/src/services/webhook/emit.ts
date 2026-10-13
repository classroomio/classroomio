import { getActiveOrganizationPlan, getOrganizationById } from '@cio/db/queries/organization';
import { insertWebhookEventWithDeliveries, listActiveEndpointsForEvent } from '@cio/db/queries/webhook';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TGroupmember } from '@cio/db/types';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { WEBHOOK_API_VERSION, type TWebhookEventType } from '@cio/utils/constants/webhook';
import { canUsePublicApi } from '@cio/utils/plans';

import { env } from '../../config/env';

import { createWebhookRecordId } from './deliver';

export type TWebhookEventEnvelope = {
  id: string;
  type: string;
  createdAt: string;
  apiVersion: string;
  organization: { id: string; siteName: string | null };
  data: Record<string, unknown>;
};

export async function buildWebhookEnvelope(
  organizationId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<TWebhookEventEnvelope> {
  const organization = await getOrganizationById(organizationId);

  return {
    id: createWebhookRecordId('evt'),
    type: eventType,
    createdAt: new Date().toISOString(),
    apiVersion: WEBHOOK_API_VERSION,
    organization: { id: organizationId, siteName: organization?.siteName ?? null },
    data
  };
}

/**
 * Records the event for every subscribed endpoint and schedules delivery. Call after the domain
 * write commits. Never throws: a webhook failure must not fail the action that triggered it.
 */
export async function emitWebhookEvent(
  organizationId: string,
  eventType: TWebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const endpoints = await listActiveEndpointsForEvent(organizationId, eventType);

    if (endpoints.length === 0) return;

    const activePlan = await getActiveOrganizationPlan(organizationId);

    if (!canUsePublicApi(activePlan?.planName ?? null, env.PUBLIC_IS_SELFHOSTED === 'true')) return;

    const envelope = await buildWebhookEnvelope(organizationId, eventType, data);
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
    console.error('emitWebhookEvent error:', { eventType, organizationId, error });
  }
}

/**
 * Resolves the course's organization and emits the event with `courseId` merged into the data.
 * Never throws.
 */
export async function emitCourseWebhookEvent(
  courseId: string,
  eventType: TWebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const organizationId = await getCourseOrganizationId(courseId);

    if (!organizationId) return;

    await emitWebhookEvent(organizationId, eventType, { courseId, ...data });
  } catch (error) {
    console.error('emitCourseWebhookEvent error:', { eventType, courseId, error });
  }
}

export async function emitCourseMemberWebhookEvent(
  eventType: 'course.member.added' | 'course.member.removed',
  courseId: string,
  member: TGroupmember
): Promise<void> {
  await emitCourseWebhookEvent(courseId, eventType, {
    memberId: member.id,
    profileId: member.profileId,
    email: member.email,
    roleId: member.roleId
  });
}
