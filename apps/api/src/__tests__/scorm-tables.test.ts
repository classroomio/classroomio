import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ScormFixture = {
  orgId: string;
  profileId: string;
  courseId: string;
  activityId: string;
  assetId: string;
};

async function createScormFixture(suffix: string): Promise<ScormFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `scorm-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `scorm-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'SCORM baseline',
      description: 'PR 5 schema tables',
      groupId: group.id,
      slug: `scorm-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Scorm ${suffix}`, email: `scorm-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Scorm ${suffix}`,
    username: `scorm-${suffix}`,
    email: `scorm-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();

  return { orgId: organization.id, profileId: userId, courseId: course.id, activityId: activity.id, assetId: asset.id };
}

async function cleanupScormFixture(fixture: ScormFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
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
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('scorm tables (PR 5 schema)', () => {
  it('creates versions with uploading defaults and nullable processing columns', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [version] = await db
        .insert(schema.contentPackageVersion)
        .values({ assetId: fixture.assetId, versionNumber: 1, uploadKey: 'zip/1.zip', contentPrefix: 'scorm/1/v1' })
        .returning();

      expect(version.status).toBe('uploading');
      expect(version.isCurrent).toBe(false);
      expect(version.format).toBeNull();
      expect(version.warnings).toEqual([]);
      expect(version.processingJobId).toBeNull();
    } finally {
      await cleanupScormFixture(fixture);
    }
  });

  it('keeps one current version per asset', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const values = { assetId: fixture.assetId, uploadKey: 'zip/1.zip', contentPrefix: 'scorm/1/v1' };

      await db.insert(schema.contentPackageVersion).values({ ...values, versionNumber: 1, isCurrent: true });
      await expect(db.insert(schema.contentPackageVersion).values({ ...values, versionNumber: 1 })).rejects.toThrow();
      await expect(
        db.insert(schema.contentPackageVersion).values({ ...values, versionNumber: 2, isCurrent: true })
      ).rejects.toThrow();
    } finally {
      await cleanupScormFixture(fixture);
    }
  });

  it('attaches scorm details with auto rule defaults and an empty asset state', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [empty] = await db.insert(schema.activityScorm).values({ activityId: fixture.activityId }).returning();
      expect(empty.assetId).toBeNull();
      expect(empty.completionRule).toBe('auto');
      expect(empty.allowRetakes).toBe(false);

      await expect(
        db.insert(schema.activityScorm).values({ activityId: fixture.activityId, assetId: fixture.assetId })
      ).rejects.toThrow();
    } finally {
      await cleanupScormFixture(fixture);
    }
  });

  it('refuses to delete a package asset while an activity uses it', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      await db.insert(schema.activityScorm).values({ activityId: fixture.activityId, assetId: fixture.assetId });
      await expect(db.delete(schema.asset).where(eq(schema.asset.id, fixture.assetId))).rejects.toThrow();
    } finally {
      await cleanupScormFixture(fixture);
    }
  });

  it('opens one attempt per learner and one try per module', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [version] = await db
        .insert(schema.contentPackageVersion)
        .values({ assetId: fixture.assetId, versionNumber: 1, uploadKey: 'zip/1.zip', contentPrefix: 'scorm/1/v1' })
        .returning();
      const [unit] = await db
        .insert(schema.contentPackageUnit)
        .values({
          packageVersionId: version.id,
          identifier: 'sco-1',
          title: 'Module',
          position: 1,
          unitType: 'sco',
          href: 'sco.html'
        })
        .returning();
      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          packageVersionId: version.id,
          attemptNumber: 1
        })
        .returning();
      await expect(
        db.insert(schema.scormAttempt).values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          packageVersionId: version.id,
          attemptNumber: 2
        })
      ).rejects.toThrow();

      const [scoAttempt] = await db
        .insert(schema.scormScoAttempt)
        .values({ attemptId: attempt.id, unitId: unit.id })
        .returning();
      expect(scoAttempt.status).toBe('active');
      expect(scoAttempt.commitSeq).toBe(0);
      expect(scoAttempt.cmi).toEqual({});
      await expect(
        db.insert(schema.scormScoAttempt).values({ attemptId: attempt.id, unitId: unit.id })
      ).rejects.toThrow();

      const [event] = await db
        .insert(schema.scormSessionEvent)
        .values({ scoAttemptId: scoAttempt.id, kind: 'launch' })
        .returning();
      expect(event.detail).toEqual({});

      await db.delete(schema.contentPackageVersion).where(eq(schema.contentPackageVersion.id, version.id));

      const remainingAttempts = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.id, attempt.id));
      const remainingTries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.id, scoAttempt.id));
      expect(remainingAttempts).toEqual([]);
      expect(remainingTries).toEqual([]);
    } finally {
      await cleanupScormFixture(fixture);
    }
  });

  it('cascades learner state when the activity goes away', async () => {
    const fixture = await createScormFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const [version] = await db
        .insert(schema.contentPackageVersion)
        .values({ assetId: fixture.assetId, versionNumber: 1, uploadKey: 'zip/1.zip', contentPrefix: 'scorm/1/v1' })
        .returning();
      const [unit] = await db
        .insert(schema.contentPackageUnit)
        .values({
          packageVersionId: version.id,
          identifier: 'sco-1',
          title: 'Module',
          position: 1,
          unitType: 'sco',
          href: 'sco.html'
        })
        .returning();
      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: fixture.activityId,
          profileId: fixture.profileId,
          packageVersionId: version.id,
          attemptNumber: 1
        })
        .returning();
      const [scoAttempt] = await db
        .insert(schema.scormScoAttempt)
        .values({ attemptId: attempt.id, unitId: unit.id })
        .returning();
      await db.insert(schema.scormSessionEvent).values({ scoAttemptId: scoAttempt.id, kind: 'commit' });

      await db.delete(schema.courseActivity).where(eq(schema.courseActivity.id, fixture.activityId));

      const remaining = await db
        .select({ id: schema.scormAttempt.id })
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.activityId, fixture.activityId));
      expect(remaining).toEqual([]);
      const tries = await db
        .select({ id: schema.scormScoAttempt.id })
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempt.id));
      expect(tries).toEqual([]);
      const events = await db
        .select({ id: schema.scormSessionEvent.id })
        .from(schema.scormSessionEvent)
        .where(eq(schema.scormSessionEvent.scoAttemptId, scoAttempt.id));
      expect(events).toEqual([]);
    } finally {
      await cleanupScormFixture(fixture);
    }
  });
});
