import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

const mocks = vi.hoisted(() => ({
  getOrganizationById: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  listActiveEndpointsForEvent: vi.fn(),
  orgHasActiveWebhookEndpoint: vi.fn(),
  insertWebhookEventWithDeliveries: vi.fn(),
  enqueueWebhookDelivery: vi.fn(),
  hasWebhookEntitlement: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({ getOrganizationById: mocks.getOrganizationById }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: mocks.getCourseOrganizationId }));
vi.mock('@cio/db/queries/webhook', () => ({
  listActiveEndpointsForEvent: mocks.listActiveEndpointsForEvent,
  orgHasActiveWebhookEndpoint: mocks.orgHasActiveWebhookEndpoint,
  insertWebhookEventWithDeliveries: mocks.insertWebhookEventWithDeliveries
}));
vi.mock('@cio/jobs', () => ({ enqueueWebhookDelivery: mocks.enqueueWebhookDelivery }));
vi.mock('@cio/core/services/webhook/entitlement', () => ({ hasWebhookEntitlement: mocks.hasWebhookEntitlement }));
vi.mock('@cio/core/services/webhook/enrich', () => ({
  enrichWebhookEventData: async (_orgId: string, _type: string, data: Record<string, unknown>) => data
}));
vi.mock('@cio/core/services/webhook/endpoint-cache', () => ({
  readOrgHasWebhookEndpoints: vi.fn().mockResolvedValue(null),
  writeOrgHasWebhookEndpoints: vi.fn(),
  readCachedCourseOrganizationId: vi.fn().mockResolvedValue(null),
  writeCachedCourseOrganizationId: vi.fn()
}));

import {
  buildMemberSource,
  emitCohortMemberWebhookEvent,
  emitCoursePublishWebhookEvent,
  emitCourseMemberAddedWebhookEvent,
  emitCourseMemberRemovedWebhookEvent,
  emitOrganizationMemberUpdatedWebhookEvent,
  emitOrganizationMemberWebhookEvent
} from '@cio/core/services/webhook/emit';
import { ZWebhookEventInput } from '@cio/utils/validation/webhook/events';
import type { TWebhookEventType } from '@cio/utils/constants/webhook';
import type { TGroupmember } from '@cio/db/types';

const orgId = '22222222-2222-4222-8222-222222222222';
const courseId = '33333333-3333-4333-8333-333333333333';
const member = {
  id: 'member-1',
  profileId: 'profile-1',
  email: 'a@b.co',
  roleId: 3,
  createdAt: '2026-10-01T09:00:00.000Z'
} as TGroupmember;

async function recorded() {
  await vi.waitFor(() => expect(mocks.insertWebhookEventWithDeliveries).toHaveBeenCalled());
  const [event] = mocks.insertWebhookEventWithDeliveries.mock.calls[0]!;

  return { type: event.eventType as TWebhookEventType, data: event.payload.data as Record<string, unknown> };
}

function expectValidInput(type: TWebhookEventType, data: Record<string, unknown>) {
  expect(() => ZWebhookEventInput[type].parse(data)).not.toThrow();
}

describe('webhook emit helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrganizationById.mockResolvedValue({ name: 'Acme', siteName: 'acme' });
    mocks.getCourseOrganizationId.mockResolvedValue(orgId);
    mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(true);
    mocks.hasWebhookEntitlement.mockResolvedValue(true);
    mocks.listActiveEndpointsForEvent.mockResolvedValue([{ id: 'endpoint-1' }]);
    mocks.insertWebhookEventWithDeliveries.mockResolvedValue([{ webhookId: 'endpoint-1' }]);
  });

  it('builds a source with every id empty unless given', () => {
    expect(buildMemberSource('cohort', { cohortId: 'cohort-1' })).toEqual({
      method: 'cohort',
      inviteId: null,
      inviteLinkId: null,
      cohortId: 'cohort-1',
      programId: null,
      apiKeyId: null
    });
  });

  it('emits course.member.added with the enrollment time, source and actor', async () => {
    await emitCourseMemberAddedWebhookEvent(courseId, member, {
      source: buildMemberSource('invite', { inviteId: 'invite-1' }),
      actorProfileId: 'actor-1'
    });
    const { type, data } = await recorded();

    expect(type).toBe('course.member.added');
    expect(data).toMatchObject({
      enrolledAt: '2026-10-01T09:00:00.000Z',
      source: { method: 'invite', inviteId: 'invite-1' },
      actorProfileId: 'actor-1'
    });
    expectValidInput(type, data);
  });

  it('emits course.member.removed with the reason and progress', async () => {
    await emitCourseMemberRemovedWebhookEvent(courseId, member, {
      actorProfileId: 'actor-1',
      reason: 'Left the company',
      progressAtRemoval: { percent: 40, completed: false, lastActiveAt: null }
    });
    const { type, data } = await recorded();

    expect(type).toBe('course.member.removed');
    expect(data).toMatchObject({ reason: 'Left the company', progressAtRemoval: { percent: 40 } });
    expect(data).not.toHaveProperty('source');
    expectValidInput(type, data);
  });

  it('emits organization member events with the numeric membership id as a string', async () => {
    await emitOrganizationMemberWebhookEvent(
      'organization.member.added',
      orgId,
      { id: 12, profileId: 'profile-1', email: null, roleId: 2, status: 'ACTIVE' },
      'actor-1'
    );
    const { type, data } = await recorded();

    expect(type).toBe('organization.member.added');
    expect(data).toMatchObject({ memberId: '12', status: 'ACTIVE', actorProfileId: 'actor-1' });
    expectValidInput(type, data);
  });

  it('emits organization.member.updated with the changes', async () => {
    await emitOrganizationMemberUpdatedWebhookEvent(
      orgId,
      { id: 12, profileId: 'profile-1', email: null, roleId: 2 },
      { roleId: { from: 3, to: 2 } },
      null
    );
    const { type, data } = await recorded();

    expect(type).toBe('organization.member.updated');
    expect(data).toMatchObject({ changes: { roleId: { from: 3, to: 2 } }, status: null });
    expectValidInput(type, data);
  });

  it('emits cohort member events for the cohort organization', async () => {
    await emitCohortMemberWebhookEvent(
      'cohort.member.removed',
      orgId,
      'cohort-1',
      { id: 'cm-1', profileId: null, email: 'a@b.co', roleId: 3 },
      'actor-1'
    );
    const { type, data } = await recorded();

    expect(type).toBe('cohort.member.removed');
    expect(data).toMatchObject({ cohortId: 'cohort-1', memberId: 'cm-1' });
    expectValidInput(type, data);
  });

  it.each([
    ['published', 'course.published'],
    ['unpublished', 'course.unpublished']
  ] as const)('emits %s only when the publish state changed', async (change, eventType) => {
    await emitCoursePublishWebhookEvent(courseId, change, 'actor-1');
    const { type, data } = await recorded();

    expect(type).toBe(eventType);
    expect(data).toMatchObject({ courseId, actorProfileId: 'actor-1' });
    expectValidInput(type, data);
  });

  it('emits nothing when the publish state did not change', async () => {
    await emitCoursePublishWebhookEvent(courseId, null, 'actor-1');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(mocks.insertWebhookEventWithDeliveries).not.toHaveBeenCalled();
  });
});
