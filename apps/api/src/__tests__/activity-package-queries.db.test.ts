import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type PackageFixture = {
  orgId: string;
  profileId: string;
  courseId: string;
  activityId: string;
  assetId: string;
  version1Id: string;
  version2Id: string;
};

async function createPackageFixture(suffix: string): Promise<PackageFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `pkg-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `pkg-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Package queries',
      description: 'PR 6 package queries',
      groupId: group.id,
      slug: `pkg-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Pkg ${suffix}`, email: `pkg-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Pkg ${suffix}`,
    username: `pkg-${suffix}`,
    email: `pkg-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version1] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      status: 'ready',
      uploadKey: 'scorm/pkg/v1.zip',
      contentPrefix: 'scorm/pkg/v1'
    })
    .returning();
  const [version2] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 2,
      status: 'ready',
      uploadKey: 'scorm/pkg/v2.zip',
      contentPrefix: 'scorm/pkg/v2'
    })
    .returning();

  return {
    orgId: organization.id,
    profileId: userId,
    courseId: course.id,
    activityId: activity.id,
    assetId: asset.id,
    version1Id: version1.id,
    version2Id: version2.id
  };
}

async function cleanupPackageFixture(fixture: PackageFixture) {
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

describe.skipIf(!hasDatabase)('package queries (PR 6)', () => {
  it('moves the current flag between ready versions only', async () => {
    const fixture = await createPackageFixture(suffix());
    try {
      const { getCurrentPackageVersion, setCurrentPackageVersion, updatePackageVersion } = await import(
        '@db/queries/activity/package-version'
      );

      expect(await getCurrentPackageVersion(fixture.assetId)).toBeNull();

      const first = await setCurrentPackageVersion(fixture.version1Id);
      expect(first.isCurrent).toBe(true);

      const second = await setCurrentPackageVersion(fixture.version2Id);
      expect(second.isCurrent).toBe(true);
      expect((await getCurrentPackageVersion(fixture.assetId))?.id).toBe(fixture.version2Id);

      await updatePackageVersion(fixture.version1Id, { status: 'processing' });
      await expect(setCurrentPackageVersion(fixture.version1Id)).rejects.toThrow();
    } finally {
      await cleanupPackageFixture(fixture);
    }
  });

  it('writes, lists and clears units per version', async () => {
    const fixture = await createPackageFixture(suffix());
    try {
      const { bulkInsertPackageUnits, deletePackageUnitsByVersion, listPackageUnitsByVersion } = await import(
        '@db/queries/activity/package-unit'
      );

      const rows = await bulkInsertPackageUnits([
        {
          packageVersionId: fixture.version1Id,
          identifier: 'sco-1',
          title: 'Module one',
          position: 0,
          unitType: 'sco',
          href: 'sco1.html'
        },
        {
          packageVersionId: fixture.version1Id,
          identifier: 'sco-2',
          title: 'Module two',
          position: 1,
          unitType: 'sco',
          href: 'sco2.html'
        }
      ]);

      expect(rows).toHaveLength(2);
      const listed = await listPackageUnitsByVersion(fixture.version1Id);
      expect(listed.map((row) => row.identifier)).toEqual(['sco-1', 'sco-2']);
      expect(await listPackageUnitsByVersion(fixture.version2Id)).toEqual([]);

      expect(await deletePackageUnitsByVersion(fixture.version1Id)).toBe(2);
      expect(await listPackageUnitsByVersion(fixture.version1Id)).toEqual([]);
    } finally {
      await cleanupPackageFixture(fixture);
    }
  });

  it('closes open attempts on superseded versions only', async () => {
    const fixture = await createPackageFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { closeSupersededAttempts } = await import('@db/queries/scorm/attempt');

      await db.insert(schema.scormAttempt).values({
        activityId: fixture.activityId,
        profileId: fixture.profileId,
        packageVersionId: fixture.version1Id,
        attemptNumber: 1
      });
      await db.insert(schema.scormAttempt).values({
        activityId: fixture.activityId,
        profileId: fixture.profileId,
        packageVersionId: fixture.version2Id,
        attemptNumber: 2,
        closedAt: new Date().toISOString(),
        closeReason: 'finished'
      });

      const closed = await closeSupersededAttempts(fixture.assetId, fixture.version2Id, 'replaced');
      expect(closed).toBe(1);

      const [oldAttempt] = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.packageVersionId, fixture.version1Id));
      expect(oldAttempt?.closeReason).toBe('replaced');
      expect(await closeSupersededAttempts(fixture.assetId, fixture.version2Id, 'replaced')).toBe(0);
    } finally {
      await cleanupPackageFixture(fixture);
    }
  });
});
