import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ZScormSessionEventDetail, ZScormSessionEventUserAgent } from '@cio/utils/validation/activity/scorm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe('scorm session event validation', () => {
  it('rejects details larger than 2KB', () => {
    expect(ZScormSessionEventDetail.safeParse({}).success).toBe(true);
    expect(ZScormSessionEventDetail.safeParse({ blob: 'x'.repeat(2048) }).success).toBe(false);
  });

  it('rejects user agents longer than 512 characters', () => {
    expect(ZScormSessionEventUserAgent.safeParse(undefined).success).toBe(true);
    expect(ZScormSessionEventUserAgent.safeParse('x'.repeat(512)).success).toBe(true);
    expect(ZScormSessionEventUserAgent.safeParse('x'.repeat(513)).success).toBe(false);
  });
});

type ConstraintFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  profileId: string;
  activityId: string;
  assetId: string;
  versionId: string;
  unitId: string;
};

async function createConstraintFixture(suffix: string): Promise<ConstraintFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `sc-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `sc-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Constraint course',
      description: 'Schema improvement constraints',
      groupId: group.id,
      slug: `sc-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Sc ${suffix}`, email: `sc-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Sc ${suffix}`,
    username: `sc-${suffix}`,
    email: `sc-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({
      courseId: course.id,
      sectionId: null,
      kind: 'scorm' as never,
      title: 'Package',
      slug: 'package',
      order: 1
    })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: `sc-${suffix}` })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      isCurrent: true,
      status: 'ready' as never,
      uploadKey: `scorm/${asset.id}/v1.zip`,
      contentPrefix: `scorm/${asset.id}/v1`
    })
    .returning();
  const [unit] = await db
    .insert(schema.contentPackageUnit)
    .values({
      packageVersionId: version.id,
      identifier: `sco-${suffix}`,
      title: 'Module',
      position: 1,
      unitType: 'sco' as never,
      href: 'sco.html',
      formatDetails: { format: 'scorm12' } as never
    })
    .returning();

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    profileId: userId,
    activityId: activity.id,
    assetId: asset.id,
    versionId: version.id,
    unitId: unit.id
  };
}

async function cleanupConstraintFixture(fixture: ConstraintFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.scormSessionEvent).where(eq(schema.scormSessionEvent.userAgent, fixture.courseId));
  const attempts = await db
    .select({ id: schema.scormAttempt.id })
    .from(schema.scormAttempt)
    .where(eq(schema.scormAttempt.activityId, fixture.activityId));
  for (const attempt of attempts) {
    await db.delete(schema.scormScoAttempt).where(eq(schema.scormScoAttempt.attemptId, attempt.id));
  }
  await db.delete(schema.scormAttempt).where(eq(schema.scormAttempt.activityId, fixture.activityId));
  await db.delete(schema.activityScorm).where(eq(schema.activityScorm.activityId, fixture.activityId));
  await db
    .delete(schema.activityCompletionSideEffect)
    .where(eq(schema.activityCompletionSideEffect.profileId, fixture.profileId));
  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.contentPackageUnit).where(eq(schema.contentPackageUnit.packageVersionId, fixture.versionId));
  await db.delete(schema.contentPackageVersion).where(eq(schema.contentPackageVersion.id, fixture.versionId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.id, fixture.assetId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

describe.skipIf(!hasDatabase)('activity schema constraints', () => {
  it('rejects single-activity courses with LIVE_CLASS or PUBLIC types', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const [organization] = await db.insert(schema.organization).values({ name: suffix }).returning();
    const [group] = await db.insert(schema.group).values({ name: suffix, organizationId: organization.id }).returning();

    try {
      const [allowed] = await db
        .insert(schema.course)
        .values({
          title: 'Single activity',
          description: 'Allowed type',
          groupId: group.id,
          slug: `${suffix}-ok`,
          type: 'SELF_PACED' as never,
          format: 'single_activity' as never,
          status: 'ACTIVE'
        })
        .returning();
      expect(allowed.format).toBe('single_activity');
      await db.delete(schema.course).where(eq(schema.course.id, allowed.id));

      await expect(
        db.insert(schema.course).values({
          title: 'Single activity',
          description: 'Live class',
          groupId: group.id,
          slug: `${suffix}-live`,
          type: 'LIVE_CLASS' as never,
          format: 'single_activity' as never,
          status: 'ACTIVE'
        })
      ).rejects.toThrow();

      await expect(
        db.insert(schema.course).values({
          title: 'Single activity',
          description: 'Public',
          groupId: group.id,
          slug: `${suffix}-public`,
          type: 'PUBLIC' as never,
          format: 'single_activity' as never,
          status: 'ACTIVE'
        })
      ).rejects.toThrow();
    } finally {
      await db.delete(schema.course).where(eq(schema.course.groupId, group.id));
      await db.delete(schema.group).where(eq(schema.group.id, group.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
    }
  });

  it('rejects activity completions where is_complete disagrees with completed_at', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createConstraintFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await expect(
        db.insert(schema.activityCompletion).values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          isComplete: true
        })
      ).rejects.toThrow();

      await expect(
        db.insert(schema.activityCompletion).values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          isComplete: false,
          completedAt: new Date().toISOString()
        })
      ).rejects.toThrow();
    } finally {
      await cleanupConstraintFixture(fixture);
    }
  });

  it('rejects out-of-range pass marks', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createConstraintFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await expect(
        db.insert(schema.contentPackageUnit).values({
          packageVersionId: fixture.versionId,
          identifier: `bad-mastery-${suffix}`,
          title: 'Bad',
          position: 99,
          unitType: 'sco' as never,
          href: 'bad.html',
          masteryScoreRaw: '101' as never,
          formatDetails: { format: 'scorm12' } as never
        })
      ).rejects.toThrow();

      await expect(
        db.insert(schema.contentPackageUnit).values({
          packageVersionId: fixture.versionId,
          identifier: `bad-passing-${suffix}`,
          title: 'Bad',
          position: 100,
          unitType: 'sco' as never,
          href: 'bad.html',
          passingScoreScaled: '2' as never,
          formatDetails: { format: 'scorm12' } as never
        })
      ).rejects.toThrow();

      await expect(
        db.insert(schema.contentPackageUnit).values({
          packageVersionId: fixture.versionId,
          identifier: `bad-threshold-${suffix}`,
          title: 'Bad',
          position: 101,
          unitType: 'sco' as never,
          href: 'bad.html',
          completionThreshold: '2' as never,
          formatDetails: { format: 'scorm12' } as never
        })
      ).rejects.toThrow();

      await expect(
        db.insert(schema.activityScorm).values({ activityId: fixture.activityId, minScorePercent: 101 })
      ).rejects.toThrow();
    } finally {
      await cleanupConstraintFixture(fixture);
    }
  });

  it('rejects a current version with replaced_at set', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createConstraintFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await expect(
        db
          .update(schema.contentPackageVersion)
          .set({ replacedAt: new Date().toISOString() })
          .where(eq(schema.contentPackageVersion.id, fixture.versionId))
      ).rejects.toThrow();
    } finally {
      await cleanupConstraintFixture(fixture);
    }
  });

  it('rejects a closed attempt without a reason', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createConstraintFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await expect(
        db.insert(schema.scormAttempt).values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          packageVersionId: fixture.versionId,
          attemptNumber: 1,
          closedAt: new Date().toISOString()
        })
      ).rejects.toThrow();
    } finally {
      await cleanupConstraintFixture(fixture);
    }
  });

  it('rejects unknown enum values', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createConstraintFixture(suffix);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await expect(
        db.insert(schema.courseActivity).values({
          courseId: fixture.courseId,
          sectionId: null,
          kind: 'cmi5' as never,
          title: 'Unknown kind',
          slug: 'unknown-kind',
          order: 99
        })
      ).rejects.toThrow();

      await expect(
        db
          .update(schema.course)
          .set({ format: 'scorm' as never })
          .where(eq(schema.course.id, fixture.courseId))
      ).rejects.toThrow();
    } finally {
      await cleanupConstraintFixture(fixture);
    }
  });
});
