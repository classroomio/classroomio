import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('public API tags against the database', () => {
  const suffix = `${Date.now()}`;
  const color = '#EF4444';
  let organizationId = '';
  let userId = '';
  let groupId = '';
  let paidCourseId = '';
  let tagGroupId = '';

  const tagIdsOnCourse = async (courseId: string) => {
    const { getCourseTagsForOrganization } = await import('@db/queries/tag');

    return (await getCourseTagsForOrganization(organizationId, courseId)).map((tag) => tag.id).sort();
  };

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `tags-db-${suffix}` });
    organizationId = organization.id;

    const email = `admin-${suffix}@tags-db.test`;
    const [user] = await db.insert(schema.user).values({ name: 'admin', email, emailVerified: true }).returning();
    userId = user.id;
    await db.insert(schema.profile).values({ id: userId, fullname: 'Admin', username: `admin-${suffix}`, email });
    await db.insert(schema.organizationmember).values({ organizationId, profileId: userId, roleId: ROLE.ADMIN });

    const [group] = await db
      .insert(schema.group)
      .values({ name: `tags-db-${suffix}`, organizationId })
      .returning();
    groupId = group.id;

    // Paid with no payment link: the full course update refuses to save it.
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Paid course', description: 'Tags fixture', groupId, slug: `tags-db-${suffix}`, cost: 50 })
      .returning();
    paidCourseId = course.id;

    const { createPublicApiTagGroupService } = await import('@api/services/v1/tags');
    tagGroupId = (await createPublicApiTagGroupService(organizationId, userId, { name: `Topics ${suffix}` })).id;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (paidCourseId) {
      await db.delete(schema.tagAssignment).where(eq(schema.tagAssignment.courseId, paidCourseId));
    }
    if (organizationId) {
      await db.delete(schema.tag).where(eq(schema.tag.organizationId, organizationId));
      await db.delete(schema.tagGroup).where(eq(schema.tagGroup.organizationId, organizationId));
    }
    if (groupId) {
      await db.delete(schema.course).where(eq(schema.course.groupId, groupId));
      await db.delete(schema.group).where(eq(schema.group.id, groupId));
    }
    if (organizationId) {
      await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, organizationId));
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    if (userId) {
      await db.delete(schema.profile).where(eq(schema.profile.id, userId));
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  });

  it('creates one tag and refuses the other when two creates with the same name arrive at once', async () => {
    const { createPublicApiTagService } = await import('@api/services/v1/tags');

    const results = await Promise.allSettled([
      createPublicApiTagService(organizationId, userId, { name: 'Safety', groupId: tagGroupId, color }),
      createPublicApiTagService(organizationId, userId, { name: 'SAFETY', groupId: tagGroupId, color })
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { statusCode: 409, code: 'TAG_ALREADY_EXISTS' }
    });
  });

  it('creates different names that share the fallback slug', async () => {
    const { createPublicApiTagService } = await import('@api/services/v1/tags');

    const maths = await createPublicApiTagService(organizationId, userId, { name: '数学', groupId: tagGroupId, color });
    const physics = await createPublicApiTagService(organizationId, userId, {
      name: '物理',
      groupId: tagGroupId,
      color
    });

    expect(maths.slug).toBe('tag');
    expect(physics.slug).toBe('tag-1');
  });

  it('refuses a rename to a name another tag has, and allows a case-only rename of itself', async () => {
    const { createPublicApiTagService, updatePublicApiTagService } = await import('@api/services/v1/tags');
    const fire = await createPublicApiTagService(organizationId, userId, { name: 'Fire', groupId: tagGroupId, color });

    await expect(
      updatePublicApiTagService(organizationId, userId, { tagId: fire.id }, { name: 'safety' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'TAG_ALREADY_EXISTS' });

    const renamed = await updatePublicApiTagService(organizationId, userId, { tagId: fire.id }, { name: 'FIRE' });
    expect(renamed.name).toBe('FIRE');
  });

  it('sets tags on a course whose other settings would fail the full course update', async () => {
    const { createPublicApiTagService } = await import('@api/services/v1/tags');
    const { updatePublicApiCourseService } = await import('@api/services/v1/courses/course');
    const tag = await createPublicApiTagService(organizationId, userId, { name: 'Paid', groupId: tagGroupId, color });

    await expect(
      updatePublicApiCourseService(organizationId, userId, { courseId: paidCourseId }, { title: 'Renamed' })
    ).rejects.toMatchObject({ statusCode: 400 });

    const { course } = await updatePublicApiCourseService(
      organizationId,
      userId,
      { courseId: paidCourseId },
      { tagIds: [tag.id] }
    );

    expect(course.tags.map((courseTag) => courseTag.id)).toEqual([tag.id]);
  });

  it('keeps both tags when two addTagIds calls on one course arrive at once', async () => {
    const { createPublicApiTagService } = await import('@api/services/v1/tags');
    const { updatePublicApiCourseService } = await import('@api/services/v1/courses/course');
    const first = await createPublicApiTagService(organizationId, userId, {
      name: 'First',
      groupId: tagGroupId,
      color
    });
    const second = await createPublicApiTagService(organizationId, userId, {
      name: 'Second',
      groupId: tagGroupId,
      color
    });
    const before = await tagIdsOnCourse(paidCourseId);

    await Promise.all([
      updatePublicApiCourseService(organizationId, userId, { courseId: paidCourseId }, { addTagIds: [first.id] }),
      updatePublicApiCourseService(organizationId, userId, { courseId: paidCourseId }, { addTagIds: [second.id] })
    ]);

    expect(await tagIdsOnCourse(paidCourseId)).toEqual([...before, first.id, second.id].sort());
  });
});
