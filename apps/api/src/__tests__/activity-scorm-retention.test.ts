import 'dotenv/config';

import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const storedObjects = new Map<string, string>();

vi.mock('@cio/core/config/storage', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/storage')>();

  return {
    ...original,
    getStorageConfig: () => ({ bucketScorm: 'scorm' }),
    getS3Client: () => ({
      send: async (command: unknown) => {
        if (command instanceof ListObjectsV2Command) {
          const prefix = command.input.Prefix ?? '';
          const keys = [...storedObjects.keys()].filter((key) => key.startsWith(prefix));

          return { Contents: keys.map((Key) => ({ Key })), IsTruncated: false };
        }

        if (command instanceof DeleteObjectsCommand) {
          const keys = (command.input.Delete?.Objects ?? []).map((entry) => entry.Key).filter(Boolean);

          for (const key of keys) storedObjects.delete(key as string);

          return { Deleted: keys.map((Key) => ({ Key })) };
        }

        throw new Error('unexpected S3 command');
      }
    })
  };
});

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret' };
});

import { runScormRetention } from '@cio/core/services/activity/retention';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type RetentionFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  activityId: string;
  assetId: string;
  profileId: string;
  versionIds: string[];
  prefixes: string[];
};

async function createRetentionFixture(suffix: string): Promise<RetentionFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `rt-${suffix}`, siteName: `rt-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `rt-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Retention course',
      description: 'Schema improvements retention',
      groupId: group.id,
      slug: `rt-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE',
      isPublished: true
    })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Rt ${suffix}`, email: `rt-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Rt ${suffix}`,
    username: `rt-${suffix}`,
    email: `rt-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Retention zip' })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id, assetId: asset.id });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    activityId: activity.id,
    assetId: asset.id,
    profileId: userId,
    versionIds: [],
    prefixes: []
  };
}

async function createVersion(
  fixture: RetentionFixture,
  versionNumber: number,
  suffix: string,
  overrides: Record<string, unknown> = {}
) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const prefix = `scorm/rt-${suffix}/v${versionNumber}`;
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: fixture.assetId,
      versionNumber,
      status: 'ready',
      isCurrent: false,
      format: 'scorm12',
      uploadKey: `${prefix}.zip`,
      contentPrefix: prefix,
      ...overrides
    } as never)
    .returning();
  if (!version) throw new Error(`missing version ${versionNumber}`);

  fixture.versionIds.push(version.id);
  fixture.prefixes.push(prefix);

  return version;
}

async function cleanupRetentionFixture(fixture: RetentionFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const attempts = await db
    .select({ id: schema.scormAttempt.id })
    .from(schema.scormAttempt)
    .where(eq(schema.scormAttempt.activityId, fixture.activityId));
  for (const attempt of attempts) {
    await db.delete(schema.scormScoAttempt).where(eq(schema.scormScoAttempt.attemptId, attempt.id));
  }
  await db.delete(schema.scormAttempt).where(eq(schema.scormAttempt.activityId, fixture.activityId));
  await db.delete(schema.activityScorm).where(eq(schema.activityScorm.activityId, fixture.activityId));
  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, fixture.orgId));
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

describe.skipIf(!hasDatabase)('scorm retention keeps package files', () => {
  it('keeps replaced versions, rows and files', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const current = suffix();
    const fixture = await createRetentionFixture(current);
    const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();

    const first = await createVersion(fixture, 1, current, { isCurrent: false, replacedAt: ancient });
    await createVersion(fixture, 2, current, { isCurrent: true, replacedAt: null });

    storedObjects.clear();
    storedObjects.set(`${first.contentPrefix}/sco.html`, '<html>v1</html>');
    storedObjects.set(`${first.contentPrefix}/index.json`, '[]');
    storedObjects.set(first.uploadKey, 'zip-bytes');

    try {
      const result = await runScormRetention(90, 30);

      expect(result.versionsDeleted).toBe(0);
      expect(result.versionsArchived).toBe(0);
      expect(result.objectsDeleted).toBe(0);
      expect(storedObjects.get(`${first.contentPrefix}/sco.html`)).toBe('<html>v1</html>');
      expect(storedObjects.get(first.uploadKey)).toBe('zip-bytes');

      const remaining = await db
        .select({ id: schema.contentPackageVersion.id })
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.assetId, fixture.assetId));

      expect(remaining.map((row) => row.id)).toContain(first.id);
    } finally {
      storedObjects.clear();
      await cleanupRetentionFixture(fixture);
    }
  });

  it('keeps a replaced version with attempts and files', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const current = suffix();
    const fixture = await createRetentionFixture(current);
    const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();

    const first = await createVersion(fixture, 1, current, { isCurrent: false, replacedAt: ancient });
    await db.insert(schema.contentPackageUnit).values({
      packageVersionId: first.id,
      identifier: 'mod-1',
      title: 'Module one',
      position: 0,
      unitType: 'sco',
      href: 'mod1.html'
    });
    const second = await createVersion(fixture, 2, current, { isCurrent: true, replacedAt: null });
    await db.insert(schema.contentPackageUnit).values({
      packageVersionId: second.id,
      identifier: 'mod-1',
      title: 'Module one',
      position: 0,
      unitType: 'sco',
      href: 'mod1.html'
    });

    const [attempt] = await db
      .insert(schema.scormAttempt)
      .values({
        activityId: fixture.activityId,
        profileId: fixture.profileId,
        packageVersionId: first.id,
        attemptNumber: 1,
        closedAt: new Date().toISOString(),
        closeReason: 'finished'
      })
      .returning();
    if (!attempt) throw new Error('missing attempt');

    storedObjects.clear();
    storedObjects.set(`${first.contentPrefix}/sco.html`, '<html>v1</html>');
    storedObjects.set(first.uploadKey, 'zip-bytes');

    try {
      const result = await runScormRetention(90, 30);

      expect(result.versionsDeleted).toBe(0);
      expect(result.versionsArchived).toBe(0);
      expect(result.objectsDeleted).toBe(0);
      expect(storedObjects.get(`${first.contentPrefix}/sco.html`)).toBe('<html>v1</html>');
      expect(storedObjects.get(first.uploadKey)).toBe('zip-bytes');

      const [kept] = await db
        .select()
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.id, first.id));

      expect(kept?.status).toBe('ready');
    } finally {
      storedObjects.clear();
      await cleanupRetentionFixture(fixture);
    }
  });

  it('keeps a replaced version with an open attempt', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const current = suffix();
    const fixture = await createRetentionFixture(current);
    const ancient = new Date(Date.now() - 40 * 86_400_000).toISOString();

    const first = await createVersion(fixture, 1, current, { isCurrent: false, replacedAt: ancient });
    await createVersion(fixture, 2, current, { isCurrent: true, replacedAt: null });

    await db.insert(schema.scormAttempt).values({
      activityId: fixture.activityId,
      profileId: fixture.profileId,
      packageVersionId: first.id,
      attemptNumber: 1
    });

    storedObjects.clear();
    storedObjects.set(`${first.contentPrefix}/sco.html`, '<html>v1</html>');
    storedObjects.set(first.uploadKey, 'zip-bytes');

    try {
      const result = await runScormRetention(90, 30);

      expect(result.versionsDeleted).toBe(0);
      expect(result.versionsArchived).toBe(0);
      expect(storedObjects.get(`${first.contentPrefix}/sco.html`)).toBe('<html>v1</html>');

      const [kept] = await db
        .select()
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.id, first.id));

      expect(kept?.status).toBe('ready');
    } finally {
      storedObjects.clear();
      await cleanupRetentionFixture(fixture);
    }
  });

  it('sets replaced_at when making a version current', async () => {
    const current = suffix();
    const fixture = await createRetentionFixture(current);

    const first = await createVersion(fixture, 1, current, { isCurrent: false });
    const second = await createVersion(fixture, 2, current, { isCurrent: false });

    try {
      const { setCurrentPackageVersion, getPackageVersionById } = await import(
        '@cio/db/queries/activity/package-version'
      );

      await setCurrentPackageVersion(first.id);
      await setCurrentPackageVersion(second.id);

      const replaced = await getPackageVersionById(first.id);
      const madeCurrent = await getPackageVersionById(second.id);

      expect(replaced?.isCurrent).toBe(false);
      expect(replaced?.replacedAt).not.toBeNull();
      expect(madeCurrent?.isCurrent).toBe(true);
      expect(madeCurrent?.replacedAt).toBeNull();
    } finally {
      await cleanupRetentionFixture(fixture);
    }
  });

  it('launches the current version in review with empty data for an archived attempt', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { launchActivity } = await import('@cio/core/services/activity/activity');
    const current = suffix();
    const fixture = await createRetentionFixture(current);

    const first = await createVersion(fixture, 1, current, { isCurrent: true });
    await db.insert(schema.contentPackageUnit).values({
      packageVersionId: first.id,
      identifier: 'mod-1',
      title: 'Module one',
      position: 0,
      unitType: 'sco',
      href: 'mod1.html'
    });

    try {
      const context = { profileId: fixture.profileId, organizationId: fixture.orgId, isPreview: false };
      const opened = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!opened.available) throw new Error('launch unavailable');

      const second = await createVersion(fixture, 2, current, { isCurrent: false });
      await db.insert(schema.contentPackageUnit).values({
        packageVersionId: second.id,
        identifier: 'mod-1',
        title: 'Module one',
        position: 0,
        unitType: 'sco',
        href: 'mod1.html'
      });

      const { setCurrentPackageVersion } = await import('@cio/db/queries/activity/package-version');
      await setCurrentPackageVersion(second.id);

      const attempts = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.activityId, fixture.activityId));
      for (const attempt of attempts) {
        await db
          .update(schema.scormAttempt)
          .set({ closedAt: new Date().toISOString(), closeReason: 'finished' })
          .where(eq(schema.scormAttempt.id, attempt.id));
      }

      const { markPackageVersionArchived } = await import('@cio/db/queries/activity/package-version');
      await markPackageVersionArchived(first.id);

      const review = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!review.available) throw new Error('review launch unavailable');

      expect(review.mode).toBe('review');
      expect(review.reviewOfArchivedVersion).toBe(true);
      expect(review.units.every((unit) => unit.status === 'not_attempted')).toBe(true);
    } finally {
      await cleanupRetentionFixture(fixture);
    }
  }, 30000);
});
