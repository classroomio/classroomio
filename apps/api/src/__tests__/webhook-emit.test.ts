import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

const mocks = vi.hoisted(() => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  listActiveEndpointsForEvent: vi.fn(),
  orgHasActiveWebhookEndpoint: vi.fn(),
  insertWebhookEventWithDeliveries: vi.fn(),
  enqueueWebhookDelivery: vi.fn(),
  readOrgHasWebhookEndpoints: vi.fn(),
  writeOrgHasWebhookEndpoints: vi.fn(),
  readCachedCourseOrganizationId: vi.fn(),
  writeCachedCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan,
  getOrganizationById: mocks.getOrganizationById
}));

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: mocks.getCourseOrganizationId }));

vi.mock('@cio/db/queries/webhook', () => ({
  listActiveEndpointsForEvent: mocks.listActiveEndpointsForEvent,
  orgHasActiveWebhookEndpoint: mocks.orgHasActiveWebhookEndpoint,
  insertWebhookEventWithDeliveries: mocks.insertWebhookEventWithDeliveries
}));

vi.mock('@cio/jobs', () => ({ enqueueWebhookDelivery: mocks.enqueueWebhookDelivery }));

vi.mock('@cio/core/services/webhook/endpoint-cache', () => ({
  readOrgHasWebhookEndpoints: mocks.readOrgHasWebhookEndpoints,
  writeOrgHasWebhookEndpoints: mocks.writeOrgHasWebhookEndpoints,
  readCachedCourseOrganizationId: mocks.readCachedCourseOrganizationId,
  writeCachedCourseOrganizationId: mocks.writeCachedCourseOrganizationId
}));

import {
  emitCourseWebhookEvent,
  emitWebhookEvent,
  recordCourseWebhookEvent,
  recordWebhookEvent
} from '@cio/core/services/webhook/emit';

const orgId = '22222222-2222-4222-8222-222222222222';
const courseId = '33333333-3333-4333-8333-333333333333';
const completed = { courseId, memberId: 'm', profileId: 'p', completedAt: '2026-10-19T00:00:00.000Z' };

describe('webhook event recording cost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(null);
    mocks.readCachedCourseOrganizationId.mockResolvedValue(null);
    mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(false);
    mocks.getCourseOrganizationId.mockResolvedValue(orgId);
    mocks.listActiveEndpointsForEvent.mockResolvedValue([]);
  });

  it('stops after one lookup for an org with no active webhooks and remembers the answer', async () => {
    await recordWebhookEvent(orgId, 'course.completed', completed);

    expect(mocks.orgHasActiveWebhookEndpoint).toHaveBeenCalledTimes(1);
    expect(mocks.writeOrgHasWebhookEndpoints).toHaveBeenCalledWith(orgId, false);
    expect(mocks.listActiveEndpointsForEvent).not.toHaveBeenCalled();
  });

  it('trusts a cached "no webhooks" answer without touching the database', async () => {
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(false);

    await recordWebhookEvent(orgId, 'course.completed', completed);

    expect(mocks.orgHasActiveWebhookEndpoint).not.toHaveBeenCalled();
    expect(mocks.listActiveEndpointsForEvent).not.toHaveBeenCalled();
  });

  it('looks up the endpoints when the cache says the org has webhooks', async () => {
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(true);

    await recordWebhookEvent(orgId, 'course.completed', completed);

    expect(mocks.orgHasActiveWebhookEndpoint).not.toHaveBeenCalled();
    expect(mocks.listActiveEndpointsForEvent).toHaveBeenCalledWith(orgId, 'course.completed');
  });

  it('reads the course organization from the cache before the database', async () => {
    mocks.readCachedCourseOrganizationId.mockResolvedValue(orgId);
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(false);

    await recordCourseWebhookEvent(courseId, 'course.completed', {
      memberId: 'm',
      profileId: 'p',
      completedAt: completed.completedAt
    });

    expect(mocks.getCourseOrganizationId).not.toHaveBeenCalled();
  });

  it('caches the course organization after the first database lookup', async () => {
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(false);

    await recordCourseWebhookEvent(courseId, 'course.completed', {
      memberId: 'm',
      profileId: 'p',
      completedAt: completed.completedAt
    });

    expect(mocks.getCourseOrganizationId).toHaveBeenCalledTimes(1);
    expect(mocks.writeCachedCourseOrganizationId).toHaveBeenCalledWith(courseId, orgId);
  });
});

describe('emitting without making the request wait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readOrgHasWebhookEndpoints.mockResolvedValue(null);
    mocks.readCachedCourseOrganizationId.mockResolvedValue(null);
    mocks.listActiveEndpointsForEvent.mockResolvedValue([]);
  });

  it('returns before any lookup has finished, then records in the background', async () => {
    let finishLookup: (hasEndpoints: boolean) => void = () => {};
    mocks.orgHasActiveWebhookEndpoint.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishLookup = resolve;
      })
    );

    await emitWebhookEvent(orgId, 'course.completed', completed);

    expect(mocks.writeOrgHasWebhookEndpoints).not.toHaveBeenCalled();

    finishLookup(false);

    await vi.waitFor(() => expect(mocks.writeOrgHasWebhookEndpoints).toHaveBeenCalledWith(orgId, false));
  });

  it('records no more than five events at the same time', async () => {
    let running = 0;
    let peak = 0;
    const releases: Array<() => void> = [];
    mocks.orgHasActiveWebhookEndpoint.mockImplementation(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise<void>((resolve) => releases.push(resolve));
      running -= 1;

      return false;
    });

    for (let index = 0; index < 12; index += 1) {
      await emitWebhookEvent(orgId, 'course.completed', completed);
    }

    await vi.waitFor(() => expect(releases.length).toBe(5));
    expect(peak).toBe(5);

    while (mocks.writeOrgHasWebhookEndpoints.mock.calls.length < 12) {
      releases.splice(0).forEach((release) => release());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(peak).toBe(5);
  });

  it('resolves the course in the background for a course event', async () => {
    mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(false);
    mocks.getCourseOrganizationId.mockResolvedValue(orgId);

    await emitCourseWebhookEvent(courseId, 'course.completed', {
      memberId: 'm',
      profileId: 'p',
      completedAt: completed.completedAt
    });

    await vi.waitFor(() => expect(mocks.writeCachedCourseOrganizationId).toHaveBeenCalledWith(courseId, orgId));
  });
});
