import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ACTIVITY_KINDS } from '@cio/utils/constants/activity';
import { ContentType } from '@cio/utils/constants/content';
import { COURSE_FORMAT_VALUES } from '@cio/utils/constants/course-format';
import { LICENSE_FEATURE } from '@cio/utils/license';
import {
  ZActivityAttachPackage,
  ZActivityCreate,
  ZActivityLaunch,
  ZActivityParam,
  ZActivityUpdate
} from '@cio/utils/validation/activity';
import { ZCourseCreate, ZCourseUpdate } from '@cio/utils/validation/course';
import { ACTIVITY_PROVIDERS } from '@cio/core/services/activity/providers';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe('activity platform contracts (dark)', () => {
  it('adds Activity to the content type enum', () => {
    expect(ContentType.Activity).toBe('ACTIVITY');
  });

  it('starts with scorm as the only activity kind', () => {
    expect([...ACTIVITY_KINDS]).toEqual(['scorm']);
  });

  it('supports standard and scorm course formats', () => {
    expect([...COURSE_FORMAT_VALUES]).toEqual(['standard', 'scorm']);
  });

  it('accepts valid activity payloads and rejects bad kinds', () => {
    expect(ZActivityCreate.safeParse({ kind: 'scorm', title: 'Package' }).success).toBe(true);
    expect(ZActivityCreate.safeParse({ kind: 'cmi5', title: 'Package' }).success).toBe(false);
    expect(ZActivityCreate.safeParse({ kind: 'scorm', title: '' }).success).toBe(false);
    expect(ZActivityUpdate.safeParse({ title: 'Renamed', instructions: '<p>Hi</p>', isUnlocked: false }).success).toBe(
      true
    );
    expect(ZActivityAttachPackage.safeParse({ assetId: crypto.randomUUID() }).success).toBe(true);
    expect(ZActivityAttachPackage.safeParse({ assetId: 'nope' }).success).toBe(false);
    expect(ZActivityParam.safeParse({ activityId: crypto.randomUUID() }).success).toBe(true);
    expect(ZActivityLaunch.safeParse({}).success).toBe(true);
    expect(ZActivityLaunch.safeParse({ unitIdentifier: 'sco-1', newAttempt: true }).success).toBe(true);
  });

  it('accepts a format on create but only scorm-to-standard on update', () => {
    const base = {
      title: 'Course',
      description: 'Description',
      type: 'SELF_PACED' as const,
      organizationId: crypto.randomUUID()
    };

    expect(ZCourseCreate.safeParse(base).success).toBe(true);
    expect(ZCourseCreate.safeParse({ ...base, format: 'standard' }).success).toBe(true);
    expect(ZCourseCreate.safeParse({ ...base, format: 'scorm' }).success).toBe(true);
    expect(ZCourseCreate.safeParse({ ...base, format: 'cmi5' }).success).toBe(false);
    expect(ZCourseUpdate.safeParse({}).success).toBe(true);
    expect(ZCourseUpdate.safeParse({ format: 'standard' }).success).toBe(true);
    expect(ZCourseUpdate.safeParse({ format: 'scorm' }).success).toBe(false);
  });

  it.skipIf(!hasDatabase)('registers a scorm provider with a working launch', async () => {
    expect(Object.keys(ACTIVITY_PROVIDERS)).toEqual(['scorm']);

    const provider = ACTIVITY_PROVIDERS.scorm;

    expect(provider.kind).toBe('scorm');
    expect(provider.licenseFeature).toBe(LICENSE_FEATURE.SCORM);
    expect(
      await provider.launch({
        activityId: crypto.randomUUID(),
        courseId: crypto.randomUUID(),
        profileId: crypto.randomUUID(),
        organizationId: crypto.randomUUID(),
        isPreview: false
      })
    ).toEqual({ available: false, message: "This package isn't available yet" });
  });
});

type ActivityFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  profileId: string;
};

async function createActivityFixture(suffix: string): Promise<ActivityFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const userId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `act-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `act-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Activity baseline',
      description: 'PR 1 activity queries',
      groupId: group.id,
      slug: `act-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  await db.insert(schema.user).values({ id: userId, name: `Act ${suffix}`, email: `act-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Act ${suffix}`,
    username: `act-${suffix}`,
    email: `act-${suffix}@example.com`
  });

  return { orgId: organization.id, groupId: group.id, courseId: course.id, sectionId: section.id, profileId: userId };
}

async function cleanupActivityFixture(fixture: ActivityFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.profileId, fixture.profileId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
  await db.delete(schema.group).where(eq(schema.group.organizationId, fixture.orgId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

describe.skipIf(!hasDatabase)('activity platform schema (dark)', () => {
  it('defaults new courses to the standard format', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const suffix = `fmt-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    const [organization] = await db.insert(schema.organization).values({ name: suffix }).returning();
    const [group] = await db.insert(schema.group).values({ name: suffix, organizationId: organization.id }).returning();
    const [course] = await db
      .insert(schema.course)
      .values({
        title: 'Format default',
        description: 'Format default',
        groupId: group.id,
        slug: suffix,
        type: 'SELF_PACED' as never,
        status: 'ACTIVE'
      })
      .returning();
    expect(course.format).toBe('standard');

    await db.update(schema.course).set({ format: 'scorm' }).where(eq(schema.course.id, course.id));
    const [scormCourse] = await db.select().from(schema.course).where(eq(schema.course.id, course.id));
    expect(scormCourse.format).toBe('scorm');

    await db.delete(schema.course).where(eq(schema.course.id, course.id));
    await db.delete(schema.group).where(eq(schema.group.id, group.id));
    await db.delete(schema.organization).where(eq(schema.organization.id, organization.id));
  });

  it('runs the activity CRUD and completion lifecycle', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fixture = await createActivityFixture(suffix);
    try {
      const queries = await import('@db/queries/activity/activity');

      expect(await queries.getActivityById(crypto.randomUUID())).toBeNull();

      const [activity] = await queries.createActivities([
        { courseId: fixture.courseId, sectionId: fixture.sectionId, kind: 'scorm', title: 'Package', order: 1 }
      ]);
      expect(activity.title).toBe('Package');
      expect(activity.isUnlocked).toBe(true);

      expect(await queries.getActivityById(activity.id)).toMatchObject({ id: activity.id });
      expect(await queries.getActivitiesByCourseId(fixture.courseId)).toHaveLength(1);
      expect(await queries.countActivitiesInCourse(fixture.courseId)).toBe(1);
      expect(await queries.getActivityNavInfoByIds([activity.id])).toMatchObject([
        { id: activity.id, courseId: fixture.courseId, activityTitle: 'Package' }
      ]);
      expect(await queries.getActivityNavInfoByIds([])).toEqual([]);

      const updated = await queries.updateActivity(activity.id, { title: 'Renamed' });
      expect(updated?.title).toBe('Renamed');

      expect(await queries.getActivityCompletionsByProfile([activity.id], fixture.profileId)).toEqual([]);

      const upserted = await queries.upsertActivityCompletion({
        activityId: activity.id,
        profileId: fixture.profileId,
        isComplete: false
      });
      expect(upserted.isComplete).toBe(false);

      expect(await queries.markActivityCompleteOnce(activity.id, fixture.profileId)).toBe(true);
      expect(await queries.markActivityCompleteOnce(activity.id, fixture.profileId)).toBe(false);
      expect(await queries.getActivityCompletionsByProfile([activity.id], fixture.profileId)).toEqual([activity.id]);

      const deleted = await queries.deleteActivity(activity.id);
      expect(deleted?.id).toBe(activity.id);
      expect(await queries.getActivityById(activity.id)).toBeNull();
      expect(await queries.getActivityCompletionsByProfile([activity.id], fixture.profileId)).toEqual([]);
    } finally {
      await cleanupActivityFixture(fixture);
    }
  });
});
