import 'dotenv/config';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { Hono } from '@api/utils/hono';

import { ZActivityCoursesCreate } from '@cio/utils/validation/activity/course';

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: { set: (key: string, val: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-1' });
    await next();
  }
}));

vi.mock('@api/middlewares/org-team-member', () => ({
  orgTeamMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  }
}));

vi.mock('@api/services/activity/plan', () => ({
  assertActivityKindAllowed: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/core/services/activity/courses', () => ({
  createCoursesFromPackages: vi.fn()
}));

import { createCoursesFromPackages } from '@cio/core/services/activity/courses';
import { assertActivityKindAllowed } from '@api/services/activity/plan';
import { activityRouter } from '@api/routes/activity';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

function coursesApp() {
  return new Hono().route('/activity', activityRouter);
}

const ORG_ID = 'org-test-1';
const HEADERS = {
  'content-type': 'application/json',
  'cio-org-id': ORG_ID
};

describe('ZActivityCoursesCreate', () => {
  it('accepts one to twenty packages with a course type', () => {
    const assetIds = Array.from(
      { length: 20 },
      (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
    );

    expect(ZActivityCoursesCreate.safeParse({ assetIds: assetIds.slice(0, 1), courseType: 'SELF_PACED' }).success).toBe(
      true
    );
    expect(
      ZActivityCoursesCreate.safeParse({
        assetIds,
        courseType: 'COMPLIANCE',
        titles: { [assetIds[0]]: 'Safety' }
      }).success
    ).toBe(true);
  });

  it('rejects an empty list, more than twenty packages and other course types', () => {
    const assetId = '00000000-0000-4000-8000-000000000001';
    const many = Array.from({ length: 21 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`);

    expect(ZActivityCoursesCreate.safeParse({ assetIds: [], courseType: 'SELF_PACED' }).success).toBe(false);
    expect(ZActivityCoursesCreate.safeParse({ assetIds: many, courseType: 'SELF_PACED' }).success).toBe(false);
    expect(ZActivityCoursesCreate.safeParse({ assetIds: [assetId], courseType: 'LIVE_CLASS' }).success).toBe(false);
    expect(ZActivityCoursesCreate.safeParse({ assetIds: ['not-a-uuid'], courseType: 'SELF_PACED' }).success).toBe(
      false
    );
  });
});

describe('POST /activity/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates one draft course per package and returns 201', async () => {
    const app = coursesApp();
    const created = [
      { id: 'course-1', title: 'Safety', slug: 'safety', activityId: 'activity-1', assetId: 'asset-1' },
      { id: 'course-2', title: 'Hygiene', slug: 'hygiene', activityId: 'activity-2', assetId: 'asset-2' }
    ];
    vi.mocked(createCoursesFromPackages).mockResolvedValue(created as never);

    const response = await app.request('/activity/courses', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        assetIds: ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'],
        courseType: 'SELF_PACED'
      })
    });

    expect(response.status).toBe(201);
    expect(assertActivityKindAllowed).toHaveBeenCalledWith(ORG_ID, 'scorm');
    expect(createCoursesFromPackages).toHaveBeenCalledWith(
      ORG_ID,
      'user-1',
      expect.objectContaining({ courseType: 'SELF_PACED' })
    );
    const json = (await response.json()) as { success: boolean; data: typeof created };
    expect(json).toMatchObject({ success: true, data: created });
  });

  it('rejects more than twenty packages with a 400', async () => {
    const app = coursesApp();
    const many = Array.from({ length: 21 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`);

    const response = await app.request('/activity/courses', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ assetIds: many, courseType: 'SELF_PACED' })
    });

    expect(response.status).toBe(400);
    expect(createCoursesFromPackages).not.toHaveBeenCalled();
  });
});

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function createPackageFixture(
  organizationId: string,
  profileId: string,
  title: string,
  status: 'ready' | 'processing' | 'uploading' | 'failed' | 'archived' = 'ready'
) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId, kind: 'scorm', provider: 'upload', title })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      isCurrent: true,
      status,
      format: 'scorm2004_4',
      title,
      uploadKey: `scorm/${asset.id}/v1.zip`,
      contentPrefix: `scorm/${asset.id}/v1`
    })
    .returning();
  await db.insert(schema.contentPackageUnit).values({
    packageVersionId: version.id,
    identifier: 'sco-1',
    title: 'Module one',
    position: 1,
    unitType: 'sco',
    href: 'sco.html'
  });

  return { asset, version };
}

describe.skipIf(!hasDatabase)('createCoursesFromPackages', () => {
  it('creates a draft SCORM course per package with the package attached', { timeout: 30000 }, async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createCoursesFromPackages: createReal } = await vi.importActual<
      typeof import('@cio/core/services/activity/courses')
    >('@cio/core/services/activity/courses');

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `pkg-courses-${suffix()}` })
      .returning();
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({ id: userId, name: 'Pkg', email: `pkg-${suffix()}@example.com` });
    await db
      .insert(schema.profile)
      .values({ id: userId, fullname: 'Pkg', username: `pkg-${suffix()}`, email: `pkg-${suffix()}@example.com` });

    const createdCourseIds: string[] = [];
    try {
      const first = await createPackageFixture(organization.id, userId, 'Manifest title one');
      const second = await createPackageFixture(organization.id, userId, 'Manifest title two');

      const created = await createReal(organization.id, userId, {
        assetIds: [first.asset.id, second.asset.id],
        courseType: 'SELF_PACED',
        titles: { [second.asset.id]: 'Overridden title' }
      });

      expect(created).toHaveLength(2);
      createdCourseIds.push(...created.map((course) => course.id));
      expect(created[0]).toMatchObject({ title: 'Manifest title one', assetId: first.asset.id });
      expect(created[1]).toMatchObject({ title: 'Overridden title', assetId: second.asset.id });

      for (const entry of created) {
        const [course] = await db.select().from(schema.course).where(eq(schema.course.id, entry.id));
        expect(course).toMatchObject({ format: 'single_activity', type: 'SELF_PACED', isPublished: false });

        const activities = await db
          .select()
          .from(schema.courseActivity)
          .where(eq(schema.courseActivity.courseId, entry.id));
        expect(activities).toHaveLength(1);
        expect(activities[0]).toMatchObject({ kind: 'scorm', title: entry.title });

        const [details] = await db
          .select()
          .from(schema.activityScorm)
          .where(eq(schema.activityScorm.activityId, activities[0].id));
        expect(details?.assetId).toBe(entry.assetId);

        const usages = await db
          .select()
          .from(schema.assetUsage)
          .where(eq(schema.assetUsage.targetId, activities[0].id));
        expect(usages).toHaveLength(1);
        expect(usages[0]).toMatchObject({ assetId: entry.assetId, slotType: 'activity_package' });
      }
    } finally {
      for (const courseId of createdCourseIds) {
        const { db: cleanDb } = await import('@db/drizzle');
        const cleanSchema = await import('@db/schema');
        const activities = await cleanDb
          .select({ id: cleanSchema.courseActivity.id })
          .from(cleanSchema.courseActivity)
          .where(eq(cleanSchema.courseActivity.courseId, courseId));
        for (const activity of activities) {
          await cleanDb
            .delete(cleanSchema.activityCompletion)
            .where(eq(cleanSchema.activityCompletion.activityId, activity.id));
        }
        await cleanDb.delete(cleanSchema.courseActivity).where(eq(cleanSchema.courseActivity.courseId, courseId));
        const [course] = await cleanDb.select().from(cleanSchema.course).where(eq(cleanSchema.course.id, courseId));
        await cleanDb.delete(cleanSchema.courseNewsfeed).where(eq(cleanSchema.courseNewsfeed.courseId, courseId));
        await cleanDb.delete(cleanSchema.course).where(eq(cleanSchema.course.id, courseId));
        if (course?.groupId) {
          await cleanDb.delete(cleanSchema.groupmember).where(eq(cleanSchema.groupmember.groupId, course.groupId));
          await cleanDb.delete(cleanSchema.group).where(eq(cleanSchema.group.id, course.groupId));
        }
      }
      const { db: cleanDb } = await import('@db/drizzle');
      const cleanSchema = await import('@db/schema');
      await cleanDb.delete(cleanSchema.asset).where(eq(cleanSchema.asset.organizationId, organization.id));
      await cleanDb.delete(cleanSchema.profile).where(eq(cleanSchema.profile.id, userId));
      await cleanDb.delete(cleanSchema.user).where(eq(cleanSchema.user.id, userId));
      await cleanDb.delete(cleanSchema.organization).where(eq(cleanSchema.organization.id, organization.id));
    }
  });

  it('creates nothing when a package has no ready version', { timeout: 30000 }, async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createCoursesFromPackages: createReal } = await vi.importActual<
      typeof import('@cio/core/services/activity/courses')
    >('@cio/core/services/activity/courses');

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `pkg-courses-${suffix()}` })
      .returning();
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({ id: userId, name: 'Pkg', email: `pkg-${suffix()}@example.com` });
    await db
      .insert(schema.profile)
      .values({ id: userId, fullname: 'Pkg', username: `pkg-${suffix()}`, email: `pkg-${suffix()}@example.com` });
    try {
      const ready = await createPackageFixture(organization.id, userId, 'Ready package');
      const processing = await createPackageFixture(organization.id, userId, 'Processing package', 'processing');

      const before = await db.select({ id: schema.course.id }).from(schema.course);
      await expect(
        createReal(organization.id, userId, {
          assetIds: [ready.asset.id, processing.asset.id],
          courseType: 'COMPLIANCE'
        })
      ).rejects.toThrow(/ready version/);
      const after = await db.select({ id: schema.course.id }).from(schema.course);
      expect(after.length).toBe(before.length);
    } finally {
      const { db: cleanDb } = await import('@db/drizzle');
      const cleanSchema = await import('@db/schema');
      await cleanDb.delete(cleanSchema.asset).where(eq(cleanSchema.asset.organizationId, organization.id));
      await cleanDb.delete(cleanSchema.profile).where(eq(cleanSchema.profile.id, userId));
      await cleanDb.delete(cleanSchema.user).where(eq(cleanSchema.user.id, userId));
      await cleanDb.delete(cleanSchema.organization).where(eq(cleanSchema.organization.id, organization.id));
    }
  });

  it('refuses packages from another organization', { timeout: 30000 }, async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createCoursesFromPackages: createReal } = await vi.importActual<
      typeof import('@cio/core/services/activity/courses')
    >('@cio/core/services/activity/courses');

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `pkg-courses-${suffix()}` })
      .returning();
    const [otherOrg] = await db
      .insert(schema.organization)
      .values({ name: `pkg-other-${suffix()}` })
      .returning();
    const userId = crypto.randomUUID();
    await db.insert(schema.user).values({ id: userId, name: 'Pkg', email: `pkg-${suffix()}@example.com` });
    await db
      .insert(schema.profile)
      .values({ id: userId, fullname: 'Pkg', username: `pkg-${suffix()}`, email: `pkg-${suffix()}@example.com` });
    try {
      const foreign = await createPackageFixture(otherOrg.id, userId, 'Foreign package');

      await expect(
        createReal(organization.id, userId, { assetIds: [foreign.asset.id], courseType: 'SELF_PACED' })
      ).rejects.toThrow(/not found/i);
    } finally {
      const { db: cleanDb } = await import('@db/drizzle');
      const cleanSchema = await import('@db/schema');
      await cleanDb.delete(cleanSchema.asset).where(eq(cleanSchema.asset.organizationId, otherOrg.id));
      await cleanDb.delete(cleanSchema.profile).where(eq(cleanSchema.profile.id, userId));
      await cleanDb.delete(cleanSchema.user).where(eq(cleanSchema.user.id, userId));
      await cleanDb.delete(cleanSchema.organization).where(eq(cleanSchema.organization.id, organization.id));
      await cleanDb.delete(cleanSchema.organization).where(eq(cleanSchema.organization.id, otherOrg.id));
    }
  });
});
