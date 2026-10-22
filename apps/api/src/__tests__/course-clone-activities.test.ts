import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const storage = vi.hoisted(() => {
  const objects = new Set<string>();
  const sent: { command: string; input: Record<string, string> }[] = [];
  const client = {
    send: async (command: { constructor: { name: string }; input: Record<string, string> }) => {
      const name = command.constructor.name;
      const input = command.input;
      sent.push({ command: name, input });

      if (name === 'ListObjectsV2Command') {
        const contents = [...objects]
          .filter((entry) => entry.startsWith(`${input.Bucket}:${input.Prefix}`))
          .map((entry) => ({ Key: entry.slice(input.Bucket.length + 1) }));
        return { Contents: contents, IsTruncated: false };
      }
      if (name === 'CopyObjectCommand') {
        objects.add(`${input.Bucket}:${input.Key}`);
      }

      return {};
    }
  };

  return { objects, sent, client };
});

vi.mock('@cio/core/config/storage', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/storage')>();

  return {
    ...original,
    getS3Client: () => storage.client,
    getStorageConfig: () => ({
      endpoint: 'http://storage.test',
      region: 'auto',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      forcePathStyle: true,
      bucketVideos: 'videos',
      bucketDocuments: 'documents',
      bucketMedia: 'media',
      bucketScorm: 'scorm',
      mediaPublicBaseUrl: null,
      presignUploadExpiresSeconds: 900,
      presignDownloadExpiresSeconds: 900
    })
  };
});

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type CloneFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  activityId: string;
  assetId: string;
  versionId: string;
  profileId: string;
};

async function createCloneFixture(suffix: string, withPackage: boolean): Promise<CloneFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `clone-act-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `clone-act-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity course',
      description: 'Clone activity coverage',
      groupId: group.id,
      slug: `clone-act-${suffix}`,
      type: 'SELF_PACED' as never,
      format: 'single_activity' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Clone ${suffix}`, email: `clone-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Clone ${suffix}`,
    username: `clone-${suffix}`,
    email: `clone-${suffix}@example.com`
  });
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, sectionId: section.id, kind: 'scorm', title: 'Package', slug: 'package', order: 1 })
    .returning();

  let assetId = '';
  let versionId = '';
  if (withPackage) {
    const [asset] = await db
      .insert(schema.asset)
      .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
      .returning();
    assetId = asset.id;
    const [version] = await db
      .insert(schema.contentPackageVersion)
      .values({
        assetId,
        versionNumber: 1,
        isCurrent: true,
        status: 'ready',
        uploadKey: 'zip/1.zip',
        contentPrefix: `scorm/${assetId}/v1`
      })
      .returning();
    versionId = version.id;
    await db.insert(schema.contentPackageUnit).values({
      packageVersionId: version.id,
      identifier: 'sco-1',
      title: 'Module',
      position: 1,
      unitType: 'sco',
      href: 'sco.html'
    });
    await db.insert(schema.activityScorm).values({ activityId: activity.id, assetId });
    await db.insert(schema.assetUsage).values({
      organizationId: organization.id,
      assetId,
      targetType: 'activity',
      targetId: activity.id,
      slotType: 'activity_package'
    });
  }

  await db
    .insert(schema.activityCompletion)
    .values({ activityId: activity.id, profileId: userId, isComplete: true, completedAt: new Date().toISOString() });

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    activityId: activity.id,
    assetId,
    versionId,
    profileId: userId
  };
}

async function cleanupCloneCourse(courseId: string, orgId: string) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const activities = await db
    .select({ id: schema.courseActivity.id })
    .from(schema.courseActivity)
    .where(eq(schema.courseActivity.courseId, courseId));
  for (const activity of activities) {
    await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.activityId, activity.id));
  }
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
  const [course] = await db.select().from(schema.course).where(eq(schema.course.id, courseId)).limit(1);
  await db.delete(schema.course).where(eq(schema.course.id, courseId));
  if (course?.groupId) {
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, course.groupId));
    await db.delete(schema.group).where(eq(schema.group.id, course.groupId));
  }
  void orgId;
}

async function cleanupCloneFixture(fixture: CloneFixture, extraCourseIds: string[] = []) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  for (const courseId of extraCourseIds) {
    await cleanupCloneCourse(courseId, fixture.orgId);
  }
  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, fixture.orgId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, fixture.profileId));
  await db.delete(schema.group).where(eq(schema.group.organizationId, fixture.orgId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('clone copies activities and format without learner state', () => {
  it('copies activity rows, shares the package and skips completions', { timeout: 30000 }, async () => {
    const fixture = await createCloneFixture(suffix(), true);
    const extraCourses: string[] = [];
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { cloneCourse } = await import('@api/services/course/clone');

      const copy = await cloneCourse(fixture.courseId, {
        title: 'Copy',
        userId: fixture.profileId,
        slug: `clone-copy-${suffix()}`,
        organizationId: fixture.orgId
      });
      extraCourses.push(copy.id);
      expect(copy.format).toBe('single_activity');

      const activities = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.courseId, copy.id));
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({ kind: 'scorm', title: 'Package', order: 1 });
      expect(activities[0].id).not.toBe(fixture.activityId);
      expect(activities[0].sectionId).not.toBe(fixture.sectionId);

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, activities[0].id));
      expect(details?.assetId).toBe(fixture.assetId);

      const usages = await db.select().from(schema.assetUsage).where(eq(schema.assetUsage.targetId, activities[0].id));
      expect(usages).toHaveLength(1);
      expect(usages[0]).toMatchObject({
        assetId: fixture.assetId,
        targetType: 'activity',
        slotType: 'activity_package'
      });

      const completions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, activities[0].id));
      expect(completions).toEqual([]);
    } finally {
      await cleanupCloneFixture(fixture, extraCourses);
    }
  });

  it('copies format and stamping for template copies', { timeout: 30000 }, async () => {
    const fixture = await createCloneFixture(suffix(), false);
    const extraCourses: string[] = [];
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { cloneCourse } = await import('@api/services/course/clone');

      const copy = await cloneCourse(
        fixture.courseId,
        {
          title: 'Template copy',
          userId: fixture.profileId,
          slug: `clone-stamp-${suffix()}`,
          organizationId: fixture.orgId,
          setSourceIds: true
        },
        undefined
      );
      extraCourses.push(copy.id);

      const [activity] = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.courseId, copy.id));
      expect(activity.sourceId).not.toBeNull();
      expect(activity.sourceSyncedAt).not.toBeNull();
    } finally {
      await cleanupCloneFixture(fixture, extraCourses);
    }
  });

  it('transfers packages to another organization without learner state', { timeout: 30000 }, async () => {
    const fixture = await createCloneFixture(suffix(), true);
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [otherOrg] = await db
      .insert(schema.organization)
      .values({ name: `clone-other-${suffix()}` })
      .returning();
    const extraCourseIds: string[] = [];
    try {
      const { cloneCourse } = await import('@api/services/course/clone');

      const copy = await cloneCourse(fixture.courseId, {
        title: 'Cross-org',
        userId: fixture.profileId,
        slug: `clone-cross-${suffix()}`,
        organizationId: otherOrg.id
      });
      extraCourseIds.push(copy.id);

      const activities = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.courseId, copy.id));
      expect(activities).toHaveLength(1);

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, activities[0].id));
      expect(details?.assetId).not.toBe(fixture.assetId);

      const [transferred] = await db.select().from(schema.asset).where(eq(schema.asset.id, details!.assetId!));
      expect(transferred).toMatchObject({ organizationId: otherOrg.id, kind: 'scorm', title: 'Package zip' });

      const versions = await db
        .select()
        .from(schema.contentPackageVersion)
        .where(eq(schema.contentPackageVersion.assetId, transferred.id));
      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({ versionNumber: 1, isCurrent: true });

      const units = await db
        .select()
        .from(schema.contentPackageUnit)
        .where(eq(schema.contentPackageUnit.packageVersionId, versions[0].id));
      expect(units.map((unit) => unit.identifier)).toEqual(['sco-1']);

      const usages = await db.select().from(schema.assetUsage).where(eq(schema.assetUsage.targetId, activities[0].id));
      expect(usages).toHaveLength(1);
      expect(usages[0]).toMatchObject({
        organizationId: otherOrg.id,
        assetId: transferred.id,
        targetType: 'activity',
        slotType: 'activity_package'
      });

      const completions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, activities[0].id));
      expect(completions).toEqual([]);

      const attempts = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.activityId, activities[0].id));
      expect(attempts).toEqual([]);
    } finally {
      for (const courseId of extraCourseIds) {
        await cleanupCloneCourse(courseId, otherOrg.id);
      }
      await db.delete(schema.asset).where(eq(schema.asset.organizationId, otherOrg.id));
      await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, fixture.profileId));
      await db.delete(schema.group).where(eq(schema.group.organizationId, otherOrg.id));
      await db.delete(schema.organization).where(eq(schema.organization.id, otherOrg.id));
      await cleanupCloneFixture(fixture);
    }
  });

  it('shows activities in the template preview', async () => {
    const fixture = await createCloneFixture(suffix(), false);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db.update(schema.course).set({ isTemplate: true }).where(eq(schema.course.id, fixture.courseId));

      const { getCourseTemplatePreview } = await import('@api/services/course/course-template');
      const preview = await getCourseTemplatePreview(fixture.courseId, fixture.orgId);

      expect(preview.counts).toMatchObject({ activities: 1 });
      const section = preview.outline.find((entry) => entry.id === fixture.sectionId);
      expect(section?.activities.map((activity) => activity.title)).toEqual(['Package']);
    } finally {
      await cleanupCloneFixture(fixture);
    }
  });

  it('shifts activity orders within the shared section space', async () => {
    const fixture = await createCloneFixture(suffix(), false);
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { shiftActivityOrders } = await import('@db/queries/course/template-sync');

      await shiftActivityOrders(fixture.courseId, fixture.sectionId, 1, db);
      const [activity] = await db
        .select()
        .from(schema.courseActivity)
        .where(eq(schema.courseActivity.id, fixture.activityId));
      expect(activity.order).toBe(2);
    } finally {
      await cleanupCloneFixture(fixture);
    }
  });

  it('pulls activity title updates and new packaged activities', async () => {
    const templateSuffix = suffix();
    const templateFixture = await createCloneFixture(`tpl-${templateSuffix}`, true);
    const extraCourses: string[] = [];
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { createCourseFromTemplate } = await import('@api/services/course/course-template');
      const { getCourseTemplateUpdates, pullCourseTemplateUpdates } = await import(
        '@api/services/course/template-sync'
      );

      await db.update(schema.course).set({ isTemplate: true }).where(eq(schema.course.id, templateFixture.courseId));

      const course = await createCourseFromTemplate(
        templateFixture.courseId,
        templateFixture.orgId,
        templateFixture.profileId,
        'Pulled course'
      );
      extraCourses.push(course.id);

      const renamedAt = new Date(Date.now() + 60_000).toISOString();
      await db
        .update(schema.courseActivity)
        .set({ title: 'Renamed package', updatedAt: renamedAt })
        .where(eq(schema.courseActivity.id, templateFixture.activityId));

      const [templateActivity] = await db
        .insert(schema.courseActivity)
        .values({
          courseId: templateFixture.courseId,
          sectionId: templateFixture.sectionId,
          kind: 'scorm',
          title: 'Second package',
          slug: 'second-package',
          order: 2
        })
        .returning();
      await db
        .insert(schema.activityScorm)
        .values({ activityId: templateActivity.id, assetId: templateFixture.assetId });
      await db.insert(schema.assetUsage).values({
        organizationId: templateFixture.orgId,
        assetId: templateFixture.assetId,
        targetType: 'activity',
        targetId: templateActivity.id,
        slotType: 'activity_package'
      });

      const updates = await getCourseTemplateUpdates(course.id, templateFixture.orgId);
      const unitIds = updates.units.filter((unit) => unit.kind === 'activity').map((unit) => unit.id);
      expect(unitIds).toEqual(expect.arrayContaining([templateFixture.activityId, templateActivity.id]));

      const pulled = await pullCourseTemplateUpdates(
        course.id,
        templateFixture.orgId,
        templateFixture.profileId,
        unitIds,
        []
      );
      expect(pulled.unitIds).toEqual(expect.arrayContaining([templateFixture.activityId, templateActivity.id]));

      const copies = await db.select().from(schema.courseActivity).where(eq(schema.courseActivity.courseId, course.id));
      const renamed = copies.find((copy) => copy.sourceId === templateFixture.activityId);
      expect(renamed?.title).toBe('Renamed package');
      const added = copies.find((copy) => copy.sourceId === templateActivity.id);
      expect(added).toMatchObject({ title: 'Second package', order: 2 });

      const [section] = await db
        .select()
        .from(schema.courseSection)
        .where(eq(schema.courseSection.courseId, course.id));
      expect(added?.sectionId).toBe(section.id);

      const [shared] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, added!.id));
      expect(shared?.assetId).toBe(templateFixture.assetId);
    } finally {
      await cleanupCloneFixture(templateFixture, extraCourses);
    }
  });
});
