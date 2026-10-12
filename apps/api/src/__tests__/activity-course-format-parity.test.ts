import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret' };
});

import { launchActivity } from '@cio/core/services/activity/activity';
import { commitScormAttempt } from '@api/services/activity/runtime-scorm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ParityFixture = {
  orgId: string;
  courseId: string;
  activityId: string;
  studentId: string;
};

async function createParityFixture(suffix: string, courseFormat: 'standard' | 'scorm'): Promise<ParityFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const studentId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `parity-${suffix}`, siteName: `parity-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `parity-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Parity course',
      description: 'Standard vs SCORM course placement',
      groupId: group.id,
      slug: `parity-${suffix}`,
      type: 'SELF_PACED' as never,
      format: courseFormat as never,
      status: 'ACTIVE',
      isPublished: true,
      certificate: null,
      compliance: null,
      metadata: {}
    })
    .returning();
  await db
    .insert(schema.user)
    .values({ id: studentId, name: `Parity ${suffix}`, email: `parity-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: studentId,
    fullname: `Parity ${suffix}`,
    username: `parity-${suffix}`,
    email: `parity-${suffix}@example.com`
  });
  await db.insert(schema.groupmember).values({
    groupId: group.id,
    roleId: 3,
    profileId: studentId,
    email: `parity-${suffix}@example.com`
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
      uploadKey: `scorm/parity-${suffix}/v1.zip`,
      contentPrefix: `scorm/parity-${suffix}/v1`
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

  return { orgId: organization.id, courseId: course.id, activityId: activity.id, studentId };
}

async function cleanupParityFixture(fixture: ParityFixture) {
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
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function launchTokenOf(playerUrl: string): string {
  const marker = '/activity/player/';

  return playerUrl.slice(playerUrl.indexOf(marker) + marker.length);
}

describe.skipIf(!hasDatabase)('scorm placement parity: standard course vs scorm course', () => {
  it('launches and completes the same package identically in both formats', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const standard = await createParityFixture(`${suffix}-std`, 'standard');
    const scormCourse = await createParityFixture(`${suffix}-scorm`, 'scorm');
    try {
      const launchedStandard = await launchActivity(
        standard.courseId,
        standard.activityId,
        {},
        {
          profileId: standard.studentId,
          organizationId: standard.orgId,
          isPreview: false
        }
      );
      const launchedScorm = await launchActivity(
        scormCourse.courseId,
        scormCourse.activityId,
        {},
        {
          profileId: scormCourse.studentId,
          organizationId: scormCourse.orgId,
          isPreview: false
        }
      );

      expect(launchedStandard.available).toBe(true);
      expect(launchedScorm.available).toBe(true);
      if (!launchedStandard.available || !launchedScorm.available) throw new Error('launch unavailable');
      expect(launchedStandard.mode).toBe(launchedScorm.mode);
      expect(launchedStandard.unit.identifier).toBe(launchedScorm.unit.identifier);

      const completedStandard = await commitScormAttempt(launchTokenOf(launchedStandard.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });
      const completedScorm = await commitScormAttempt(launchTokenOf(launchedScorm.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });

      expect(completedStandard).toMatchObject({ saved: true, completedActivity: true });
      expect(completedScorm).toMatchObject({ saved: true, completedActivity: true });

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      for (const fixture of [standard, scormCourse]) {
        const [completion] = await db
          .select()
          .from(schema.activityCompletion)
          .where(eq(schema.activityCompletion.activityId, fixture.activityId));
        expect(completion?.isComplete).toBe(true);
      }
    } finally {
      await cleanupParityFixture(standard);
      await cleanupParityFixture(scormCourse);
    }
  });
});
