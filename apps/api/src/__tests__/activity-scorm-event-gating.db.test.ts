import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret' };
});

import { launchActivity } from '@cio/core/services/activity/activity';
import { recordScormSessionEvent } from '@cio/db/queries/scorm/session-event';
import { commitScormAttempt, getScormRuntimeState } from '@api/services/activity/runtime-scorm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type GatingFixture = {
  orgId: string;
  courseId: string;
  activityId: string;
  assetId: string;
  versionId: string;
  studentId: string;
};

async function createGatingFixture(suffix: string): Promise<GatingFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const studentId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `eg-${suffix}`, siteName: `eg-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `eg-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Event gating course',
      description: 'Commit event gating',
      groupId: group.id,
      slug: `eg-${suffix}`,
      type: 'SELF_PACED' as never,
      format: 'standard' as never,
      status: 'ACTIVE',
      isPublished: true,
      certificate: null,
      compliance: null,
      metadata: {}
    })
    .returning();
  await db.insert(schema.user).values({ id: studentId, name: `Eg ${suffix}`, email: `eg-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: studentId,
    fullname: `Eg ${suffix}`,
    username: `eg-${suffix}`,
    email: `eg-${suffix}@example.com`
  });
  await db.insert(schema.groupmember).values({
    groupId: group.id,
    roleId: 3,
    profileId: studentId,
    email: `eg-${suffix}@example.com`
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
      uploadKey: `scorm/eg-${suffix}/v1.zip`,
      contentPrefix: `scorm/eg-${suffix}/v1`
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

async function cleanupGatingFixture(fixture: GatingFixture) {
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

describe.skipIf(!hasDatabase)('scorm commit event gating', () => {
  it('writes fewer than ten events for a ten-minute autocommit session', { timeout: 60000 }, async () => {
    const fixture = await createGatingFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { listScormSessionEventsByLearner } = await import('@cio/db/queries/scorm/session-event');

      const launched = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        {},
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);
      await getScormRuntimeState(token, 'gating-agent');

      const first = await commitScormAttempt(
        token,
        { commitSequence: 1, cmi: { 'core.lesson_location': 'page-1', suspend_data: 'bookmark=1' } },
        false,
        'gating-agent'
      );
      expect(first.saved).toBe(true);

      for (let seq = 2; seq <= 21; seq += 1) {
        const routine = await commitScormAttempt(
          token,
          { commitSequence: seq, cmi: { 'core.lesson_location': `page-${seq}`, suspend_data: `bookmark=${seq}` } },
          false,
          'gating-agent'
        );
        expect(routine.saved).toBe(true);
      }

      const changed = await commitScormAttempt(
        token,
        { commitSequence: 22, cmi: { 'core.lesson_status': 'failed' } },
        false,
        'gating-agent'
      );
      expect(changed.saved).toBe(true);

      const terminated = await commitScormAttempt(
        token,
        { commitSequence: 23, cmi: { 'core.lesson_location': 'page-23' }, terminate: true },
        false,
        'gating-agent'
      );
      expect(terminated.saved).toBe(true);

      const beaconed = await commitScormAttempt(
        token,
        { commitSequence: 24, cmi: { 'core.lesson_location': 'page-24' } },
        true,
        'gating-agent'
      );
      expect(beaconed.saved).toBe(true);

      const stale = await commitScormAttempt(
        token,
        { commitSequence: 24, cmi: { 'core.lesson_location': 'page-stale' } },
        false,
        'gating-agent'
      );
      expect(stale.saved).toBe(false);

      const events = await listScormSessionEventsByLearner(fixture.activityId, fixture.studentId);
      expect(events.length).toBeLessThan(10);

      const kinds = events.map((event) => event.kind);
      expect(kinds[0]).toBe('launch');
      expect(kinds).toContain('commit');
      expect(kinds).toContain('terminate');
      expect(kinds).toContain('beacon');
      expect(kinds).toContain('error');

      const tries = await db
        .select({
          commitSeq: schema.scormScoAttempt.commitSeq,
          lastCommitAt: schema.scormScoAttempt.lastCommitAt
        })
        .from(schema.scormScoAttempt)
        .innerJoin(schema.scormAttempt, eq(schema.scormScoAttempt.attemptId, schema.scormAttempt.id))
        .where(eq(schema.scormAttempt.activityId, fixture.activityId));
      const gatedTry = tries.find((row) => row.commitSeq === 24);
      expect(gatedTry?.commitSeq).toBe(24);
      expect(gatedTry?.lastCommitAt).not.toBeNull();
    } finally {
      await cleanupGatingFixture(fixture);
    }
  });

  it('rejects oversized details, long user agents and unknown kinds', { timeout: 30000 }, async () => {
    const fixture = await createGatingFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const launched = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        {},
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);
      await getScormRuntimeState(token, null);

      const [tryRow] = await db
        .select({ id: schema.scormScoAttempt.id })
        .from(schema.scormScoAttempt)
        .innerJoin(schema.scormAttempt, eq(schema.scormScoAttempt.attemptId, schema.scormAttempt.id))
        .where(eq(schema.scormAttempt.activityId, fixture.activityId))
        .limit(1);
      const tryId = tryRow?.id;
      if (!tryId) throw new Error('missing module try');

      await expect(recordScormSessionEvent(tryId, 'commit', { blob: 'x'.repeat(2048) }, null)).rejects.toThrow();
      const truncated = await recordScormSessionEvent(tryId, 'commit', { seq: 1 }, 'x'.repeat(513));
      expect(truncated.userAgent).toBe('x'.repeat(512));
      await expect(recordScormSessionEvent(tryId, 'unknown' as never, { seq: 1 }, null)).rejects.toThrow();
    } finally {
      await cleanupGatingFixture(fixture);
    }
  });
});
