import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { revokeOAuthConsent } from '@cio/db/queries/auth';
import {
  insertWebhookEventWithDeliveries,
  isManagedWebhookSubscriptionGrantActive,
  upsertManagedWebhookSubscription
} from '@cio/db/queries/webhook';
import { createEnrollmentInviteIfAbsent } from '@cio/db/queries/course/invite';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

import { createWebhookSubscriptionService } from '@api/services/v1/webhooks/subscriptions';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TAutomationPrincipal } from '@api/utils/automation-principal';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

type Fixture = {
  orgId: string;
  userId: string;
  clientId: string;
  consentId: string;
  courseIds: string[];
};

describe.skipIf(!shouldRun)('webhook subscriptions (database)', () => {
  let fixture: Fixture;

  async function createFixture(): Promise<Fixture> {
    const orgId = randomUUID();
    const userId = randomUUID();
    const clientId = `test-client-${userId}`;

    await db.insert(schema.organization).values({ id: orgId, name: `Webhook test ${orgId.slice(0, 8)}` });
    await db.insert(schema.user).values({
      id: userId,
      name: 'Webhook Test Admin',
      email: `webhook-${userId}@example.com`
    });
    await db.insert(schema.profile).values({
      id: userId,
      fullname: 'Webhook Test Admin',
      username: `webhook-${userId.slice(0, 8)}`,
      email: `webhook-${userId}@example.com`
    });
    await db.insert(schema.organizationmember).values({
      organizationId: orgId,
      roleId: 1,
      profileId: userId,
      email: `webhook-${userId}@example.com`,
      status: 'ACTIVE',
      verified: true
    });
    await db.insert(schema.organizationPlan).values({ orgId, planName: 'ENTERPRISE', isActive: true });
    await db.insert(schema.oauthClient).values({
      clientId,
      name: 'Webhook test client',
      redirectUris: ['https://example.com/callback']
    });

    const [consent] = await db
      .insert(schema.oauthConsent)
      .values({
        clientId,
        userId,
        referenceId: orgId,
        scopes: ['webhook:subscription:read', 'webhook:subscription:write']
      })
      .returning({ id: schema.oauthConsent.id });

    return { orgId, userId, clientId, consentId: consent.id, courseIds: [] };
  }

  async function cleanup(current: Fixture): Promise<void> {
    if (current.courseIds.length > 0) {
      await db.delete(schema.courseInvite).where(eq(schema.courseInvite.createdByProfileId, current.userId));
      await db.delete(schema.course).where(inArray(schema.course.id, current.courseIds));
    }
    await db.delete(schema.organizationPlan).where(eq(schema.organizationPlan.orgId, current.orgId));
    await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, current.orgId));
    await db.delete(schema.organization).where(eq(schema.organization.id, current.orgId));
    await db.delete(schema.oauthConsent).where(eq(schema.oauthConsent.id, current.consentId));
    await db.delete(schema.oauthClient).where(eq(schema.oauthClient.clientId, current.clientId));
    await db.delete(schema.profile).where(eq(schema.profile.id, current.userId));
    await db.delete(schema.user).where(eq(schema.user.id, current.userId));
  }

  function managedValues(targetUrl: string) {
    return {
      organizationId: fixture.orgId,
      oauthConsentId: fixture.consentId,
      name: `Zapier · ${targetUrl}`,
      payloadUrl: targetUrl,
      secretCiphertext: 'ciphertext',
      secretLast4: '1234',
      filterCourseId: null,
      filterCohortId: null,
      createdByProfileId: fixture.userId
    };
  }

  function principal(): TAutomationPrincipal {
    return {
      automationKey: {
        id: randomUUID(),
        oauthConsentId: fixture.consentId
      } as TAutomationPrincipal['automationKey'],
      oauthClientId: 'test-zapier-client'
    };
  }

  beforeAll(async () => {
    await db
      .insert(schema.role)
      .values([
        { id: 1, type: 'admin' },
        { id: 2, type: 'tutor' },
        { id: 3, type: 'student' }
      ])
      .onConflictDoNothing();
  });

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await cleanup(fixture);
  });

  it('creates subscriptions for concurrent subscribes without a per-plan cap', async () => {
    const [first, second] = await Promise.all([
      upsertManagedWebhookSubscription(managedValues('https://hooks.zapier.com/first'), 'course.completed'),
      upsertManagedWebhookSubscription(managedValues('https://hooks.zapier.com/second'), 'course.completed')
    ]);

    expect(first.created).toBe(true);
    expect(second.created).toBe(true);

    const rows = await db
      .select({ id: schema.webhookEndpoint.id })
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.organizationId, fixture.orgId));
    expect(rows).toHaveLength(2);
  });

  it('reactivates an auto-disabled subscription when the app subscribes again', async () => {
    const targetUrl = 'https://hooks.zapier.com/reactivate';
    const created = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.completed');
    expect(created?.created).toBe(true);

    await db
      .update(schema.webhookEndpoint)
      .set({ isActive: false, autoDisabledAt: new Date().toISOString(), consecutiveFailures: 5 })
      .where(eq(schema.webhookEndpoint.id, created!.subscription.id));

    const reactivated = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.completed');
    expect(reactivated?.reactivated).toBe(true);
    expect(reactivated?.subscription.isActive).toBe(true);
    expect(reactivated?.subscription.consecutiveFailures).toBe(0);
    expect(reactivated?.subscription.autoDisabledAt).toBeNull();
  });

  it('updates the stored filters when the app resubscribes the same URL with different filters', async () => {
    const targetUrl = 'https://hooks.zapier.com/filter-update';
    const created = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.completed');
    expect(created?.created).toBe(true);

    const updated = await upsertManagedWebhookSubscription(
      { ...managedValues(targetUrl), filterCourseId: randomUUID(), filterCohortId: randomUUID() },
      'course.completed'
    );

    expect(updated?.created).toBe(false);
    expect(updated?.reactivated).toBeUndefined();
    expect(updated?.subscription.filterCourseId).not.toBeNull();
    expect(updated?.subscription.filterCohortId).not.toBeNull();

    const [row] = await db
      .select({
        filterCourseId: schema.webhookEndpoint.filterCourseId,
        filterCohortId: schema.webhookEndpoint.filterCohortId
      })
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.id, created!.subscription.id));

    expect(row.filterCourseId).toBe(updated?.subscription.filterCourseId);
    expect(row.filterCohortId).toBe(updated?.subscription.filterCohortId);
  });

  it('updates the filters while reactivating an auto-disabled subscription', async () => {
    const targetUrl = 'https://hooks.zapier.com/filter-reactivate';
    const created = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.completed');

    await db
      .update(schema.webhookEndpoint)
      .set({ isActive: false, autoDisabledAt: new Date().toISOString(), consecutiveFailures: 5 })
      .where(eq(schema.webhookEndpoint.id, created!.subscription.id));

    const filterCourseId = randomUUID();
    const reactivated = await upsertManagedWebhookSubscription(
      { ...managedValues(targetUrl), filterCourseId },
      'course.completed'
    );

    expect(reactivated?.reactivated).toBe(true);
    expect(reactivated?.subscription.isActive).toBe(true);
    expect(reactivated?.subscription.filterCourseId).toBe(filterCourseId);
  });

  it('leaves an auto-disabled subscription disabled when the app subscribes it to a different event', async () => {
    const targetUrl = 'https://hooks.zapier.com/reactivate-conflict';
    const created = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.completed');
    const autoDisabledAt = new Date().toISOString();

    await db
      .update(schema.webhookEndpoint)
      .set({ isActive: false, autoDisabledAt, consecutiveFailures: 5 })
      .where(eq(schema.webhookEndpoint.id, created!.subscription.id));

    const conflict = await upsertManagedWebhookSubscription(managedValues(targetUrl), 'course.enrolled');

    expect(conflict?.created).toBe(false);
    expect(conflict?.reactivated).toBeUndefined();
    expect(conflict?.subscription.isActive).toBe(false);
    expect(conflict?.subscription.autoDisabledAt).not.toBeNull();
    expect(conflict?.subscription.consecutiveFailures).toBe(5);
  });

  it('deletes the subscription endpoints when the OAuth grant is revoked', async () => {
    const created = await upsertManagedWebhookSubscription(
      managedValues('https://hooks.zapier.com/cascade'),
      'course.completed'
    );
    expect(created?.created).toBe(true);

    await revokeOAuthConsent(fixture.consentId, fixture.orgId);

    const endpoints = await db
      .select({ id: schema.webhookEndpoint.id })
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.organizationId, fixture.orgId));
    const consents = await db
      .select({ id: schema.oauthConsent.id })
      .from(schema.oauthConsent)
      .where(eq(schema.oauthConsent.id, fixture.consentId));

    expect(endpoints).toHaveLength(0);
    expect(consents).toHaveLength(0);
  });

  it('treats a managed subscription grant as active only while its owner is an active admin', async () => {
    const created = await upsertManagedWebhookSubscription(
      managedValues('https://hooks.zapier.com/grant'),
      'course.completed'
    );
    expect(created?.created).toBe(true);

    expect(await isManagedWebhookSubscriptionGrantActive(fixture.consentId)).toBe(true);

    await db
      .update(schema.organizationmember)
      .set({ roleId: 3 })
      .where(eq(schema.organizationmember.profileId, fixture.userId));

    expect(await isManagedWebhookSubscriptionGrantActive(fixture.consentId)).toBe(false);
  });

  it('keeps deliveries for live endpoints when a subscription disappears mid-emit', async () => {
    const created = await upsertManagedWebhookSubscription(
      managedValues('https://hooks.zapier.com/live'),
      'course.completed'
    );
    expect(created?.created).toBe(true);

    const eventId = `evt_${randomUUID()}`;
    const now = new Date().toISOString();
    const deliveries = await insertWebhookEventWithDeliveries(
      {
        id: eventId,
        organizationId: fixture.orgId,
        eventType: 'course.completed',
        payload: { id: eventId, type: 'course.completed', data: {} }
      },
      [
        { id: `whd_${randomUUID()}`, webhookId: created!.subscription.id, nextAttemptAt: now },
        { id: `whd_${randomUUID()}`, webhookId: randomUUID(), nextAttemptAt: now }
      ]
    );

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].webhookId).toBe(created!.subscription.id);
  });

  it('creates only one enrollment invite when two requests race for the same email', async () => {
    const courseId = randomUUID();
    await db.insert(schema.course).values({
      id: courseId,
      title: 'Concurrent enrollment',
      description: 'Test course',
      slug: `concurrent-${courseId.slice(0, 8)}`
    });
    fixture.courseIds.push(courseId);

    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const inviteValues = (tokenHash: string) => ({
      courseId,
      roleId: 3,
      tokenHash,
      createdByProfileId: fixture.userId,
      expiresAt,
      maxUses: 1,
      usedCount: 0,
      isRevoked: false,
      allowedEmails: ['racer@example.com'],
      allowedDomains: null,
      metadata: {}
    });

    const [first, second] = await Promise.all([
      createEnrollmentInviteIfAbsent(courseId, 'racer@example.com', inviteValues(`hash-${randomUUID()}`)),
      createEnrollmentInviteIfAbsent(courseId, 'racer@example.com', inviteValues(`hash-${randomUUID()}`))
    ]);

    expect([first.created, second.created].filter(Boolean)).toHaveLength(1);

    const invites = await db
      .select({ id: schema.courseInvite.id })
      .from(schema.courseInvite)
      .where(eq(schema.courseInvite.courseId, courseId));
    expect(invites).toHaveLength(1);
  });

  it('rejects an SSRF-style target URL before creating a subscription', async () => {
    await expect(
      createWebhookSubscriptionService(fixture.orgId, fixture.userId, principal(), {
        targetUrl: 'http://169.254.169.254/latest/meta-data',
        eventType: 'course.completed'
      } as never)
    ).rejects.toMatchObject({ code: ErrorCodes.WEBHOOK_URL_INVALID, statusCode: 400 });

    const endpoints = await db
      .select({ id: schema.webhookEndpoint.id })
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.organizationId, fixture.orgId));
    expect(endpoints).toHaveLength(0);
  });

  it('rejects a target URL outside the client allowlist', async () => {
    await expect(
      createWebhookSubscriptionService(fixture.orgId, fixture.userId, principal(), {
        targetUrl: 'https://example.com/webhook',
        eventType: 'course.completed'
      } as never)
    ).rejects.toBeInstanceOf(AppError);
  });
});
