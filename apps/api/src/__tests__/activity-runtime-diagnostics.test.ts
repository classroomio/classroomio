import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret' };
});

import { launchActivity } from '@cio/core/services/activity/activity';
import { getScormLearnerDetail } from '@cio/core/services/activity/providers/scorm/results';
import { deleteScormAttemptsByLearner } from '@cio/db/queries/scorm/reset';
import {
  deleteScormSessionEventsOlderThan,
  listScormSessionEventsByLearner,
  recordScormSessionEvent
} from '@cio/db/queries/scorm/session-event';
import { deletePackageVersionsByIds, listStaleUnpinnedPackageVersions } from '@cio/db/queries/activity/package-version';
import {
  commitScormAttempt,
  getScormRuntimeState,
  reportScormRuntimeEvent
} from '@api/services/activity/runtime-scorm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type DiagnosticsFixture = {
  orgId: string;
  courseId: string;
  activityId: string;
  assetId: string;
  versionId: string;
  studentId: string;
};

async function createDiagnosticsFixture(suffix: string): Promise<DiagnosticsFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const studentId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `dg-${suffix}`, siteName: `dg-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `dg-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Diagnostics course',
      description: 'PR 14 diagnostics',
      groupId: group.id,
      slug: `dg-${suffix}`,
      type: 'SELF_PACED' as never,
      format: 'standard' as never,
      status: 'ACTIVE',
      isPublished: true,
      certificate: null,
      compliance: null,
      metadata: {}
    })
    .returning();
  await db.insert(schema.user).values({ id: studentId, name: `Dg ${suffix}`, email: `dg-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: studentId,
    fullname: `Dg ${suffix}`,
    username: `dg-${suffix}`,
    email: `dg-${suffix}@example.com`
  });
  await db.insert(schema.groupmember).values({
    groupId: group.id,
    roleId: 3,
    profileId: studentId,
    email: `dg-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1, isUnlocked: true })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      status: 'ready',
      isCurrent: true,
      format: 'scorm12',
      uploadKey: `scorm/dg-${suffix}/v1.zip`,
      contentPrefix: `scorm/dg-${suffix}/v1`
    })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id, assetId: asset.id });
  await db.insert(schema.contentPackageUnit).values({
    packageVersionId: version.id,
    identifier: 'mod-1',
    title: 'Module one',
    position: 0,
    unitType: 'sco',
    href: 'mod1.html'
  });

  return {
    orgId: organization.id,
    courseId: course.id,
    activityId: activity.id,
    assetId: asset.id,
    versionId: version.id,
    studentId
  };
}

async function cleanupDiagnosticsFixture(fixture: DiagnosticsFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.studentId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, fixture.orgId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  const groups = await db
    .select({ id: schema.group.id })
    .from(schema.group)
    .where(eq(schema.group.organizationId, fixture.orgId));
  for (const group of groups) {
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, group.id));
    await db.delete(schema.group).where(eq(schema.group.id, group.id));
  }
  await db.delete(schema.organizationPlan).where(eq(schema.organizationPlan.orgId, fixture.orgId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function launchTokenOf(playerUrl: string): string {
  const marker = '/activity/player/';

  return playerUrl.slice(playerUrl.indexOf(marker) + marker.length);
}

async function launchTokenFor(fixture: DiagnosticsFixture): Promise<string> {
  const launched = await launchActivity(
    fixture.courseId,
    fixture.activityId,
    {},
    { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
  );
  if (!launched.available) throw new Error('launch unavailable');

  return launchTokenOf(launched.playerUrl);
}

describe.skipIf(!hasDatabase)('scorm diagnostics events (PR 14)', () => {
  it('records launch, commit, terminate and beacon events', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const token = await launchTokenFor(fixture);
      await getScormRuntimeState(token, 'diagnostics-agent');

      const afterLaunch = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(afterLaunch.map((event) => event.kind)).toEqual(['launch']);
      expect(afterLaunch[0]?.detail).toMatchObject({ mode: 'normal' });

      await commitScormAttempt(
        token,
        { commitSequence: 1, cmi: { 'core.lesson_location': 'page-2' } },
        false,
        'diagnostics-agent'
      );

      const kinds = (await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId)).map(
        (event) => event.kind
      );
      expect(kinds).toEqual(['launch', 'commit']);

      await commitScormAttempt(
        token,
        { commitSequence: 2, cmi: { 'core.lesson_status': 'completed' }, terminate: true },
        true,
        'diagnostics-agent'
      );

      const afterBeacon = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(afterBeacon.map((event) => event.kind)).toEqual(['launch', 'commit', 'beacon']);
      expect(afterBeacon[2]?.detail).toMatchObject({ seq: 2, terminate: true });
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('records invalid commits as error events without saving', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const token = await launchTokenFor(fixture);
      await getScormRuntimeState(token, null);

      await expect(commitScormAttempt(token, { cmi: {} }, false, null)).rejects.toThrow();

      const events = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(events.map((event) => event.kind)).toEqual(['launch', 'error']);
      expect(events[1]?.detail).toMatchObject({ reason: 'invalid_commit' });
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('records player-reported events and ignores preview tokens', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const token = await launchTokenFor(fixture);

      const reported = await reportScormRuntimeEvent(token, 'initialize', {}, 'diagnostics-agent');
      expect(reported).toEqual({ recorded: true });
      const retry = await reportScormRuntimeEvent(token, 'not_initialized', { elapsedMs: 30000 }, null);
      expect(retry).toEqual({ recorded: true });

      const events = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(events.map((event) => event.kind)).toEqual(['initialize', 'not_initialized']);

      await expect(reportScormRuntimeEvent(token, 'launch' as never, {}, null)).rejects.toThrow();
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('surfaces events in the learner detail per module', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const token = await launchTokenFor(fixture);
      await getScormRuntimeState(token, null);
      await reportScormRuntimeEvent(token, 'initialize', {}, null);

      const detail = await getScormLearnerDetail(fixture.activityId, fixture.studentId);
      expect(detail.attempts).toHaveLength(1);

      const module = detail.attempts[0]?.modules.find((entry) => entry.identifier === 'mod-1');
      expect(module?.events.map((event) => event.kind)).toEqual(['launch', 'initialize']);
      expect(typeof module?.events[0]?.createdAt).toBe('string');
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('removes events with the reset cascade', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const token = await launchTokenFor(fixture);
      await getScormRuntimeState(token, null);
      expect(await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId)).toHaveLength(1);

      const removed = await deleteScormAttemptsByLearner([fixture.activityId], fixture.studentId, db);
      expect(removed).toBe(1);
      expect(await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId)).toHaveLength(0);
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('deletes only events past the retention cutoff', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const token = await launchTokenFor(fixture);
      await getScormRuntimeState(token, null);

      const rows = await db.select({ id: schema.scormScoAttempt.id }).from(schema.scormScoAttempt).limit(1);
      const tryId = rows[0]?.id;
      if (!tryId) throw new Error('missing module try');

      const old = await recordScormSessionEvent(tryId, 'commit', { seq: 1 }, null);
      const ancient = new Date(Date.now() - 100 * 86_400_000).toISOString();
      await db
        .update(schema.scormSessionEvent)
        .set({ createdAt: ancient })
        .where(eq(schema.scormSessionEvent.id, old.id));

      const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
      expect(await deleteScormSessionEventsOlderThan(cutoff)).toBe(1);

      const remaining = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(remaining.map((event) => event.kind)).toEqual(['launch']);
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('deletes replaced, unreferenced versions and keeps the rest', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await db
        .update(schema.contentPackageVersion)
        .set({ isCurrent: false })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));

      const [second] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: fixture.assetId,
          versionNumber: 2,
          status: 'ready',
          isCurrent: false,
          format: 'scorm12',
          uploadKey: `scorm/dg/${fixture.assetId}/v2.zip`,
          contentPrefix: `scorm/dg/${fixture.assetId}/v2`
        })
        .returning();
      if (!second) throw new Error('missing version 2');

      const [third] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: fixture.assetId,
          versionNumber: 3,
          status: 'ready',
          isCurrent: true,
          format: 'scorm12',
          uploadKey: `scorm/dg/${fixture.assetId}/v3.zip`,
          contentPrefix: `scorm/dg/${fixture.assetId}/v3`
        })
        .returning();
      if (!third) throw new Error('missing version 3');

      const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();
      await db
        .update(schema.contentPackageVersion)
        .set({ updatedAt: ancient })
        .where(eq(schema.contentPackageVersion.id, second.id));

      const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const stale = await listStaleUnpinnedPackageVersions(cutoff);
      const staleIds = stale.map((version) => version.id);
      expect(staleIds).toContain(second.id);
      expect(staleIds).not.toContain(fixture.versionId);
      expect(staleIds).not.toContain(third.id);

      expect(await deletePackageVersionsByIds([second.id])).toEqual([second.id]);

      const remaining = await db
        .select({ id: schema.contentPackageVersion.id })
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.assetId, fixture.assetId));

      expect(remaining.map((row) => row.id).sort()).toEqual([fixture.versionId, third.id].sort());
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });

  it('excludes replaced versions still referenced by attempts', async () => {
    const fixture = await createDiagnosticsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await launchTokenFor(fixture);

      await db
        .update(schema.contentPackageVersion)
        .set({ isCurrent: false })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));

      const [second] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: fixture.assetId,
          versionNumber: 2,
          status: 'ready',
          isCurrent: true,
          format: 'scorm12',
          uploadKey: `scorm/dg/${fixture.assetId}/v2.zip`,
          contentPrefix: `scorm/dg/${fixture.assetId}/v2`
        })
        .returning();
      if (!second) throw new Error('missing version 2');

      const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();
      await db
        .update(schema.contentPackageVersion)
        .set({ isCurrent: false, updatedAt: ancient })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));

      const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const stale = await listStaleUnpinnedPackageVersions(cutoff);

      expect(stale.map((version) => version.id)).not.toContain(fixture.versionId);
    } finally {
      await cleanupDiagnosticsFixture(fixture);
    }
  });
});
