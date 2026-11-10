import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { isUniqueConstraintViolation } from '@cio/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('bulk member inserts against the database', () => {
  const suffix = `${Date.now()}`;
  const emailPattern = `bulk-insert-${suffix}-%@bulk.test`;
  let organizationId = '';
  let courseId = '';
  let groupId = '';
  let cohortId = '';
  let profileIds: string[] = [];

  async function load() {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const drizzle = await import('drizzle-orm');
    const { addCourseMembers } = await import('@db/queries/course/people');
    const { addCohortMembers } = await import('@db/queries/cohort');
    const { addGroupMembers } = await import('@db/queries/group');

    return { db, schema, ...drizzle, addCourseMembers, addCohortMembers, addGroupMembers };
  }

  async function groupMemberCount() {
    const { db, schema, eq, count } = await load();
    const [row] = await db
      .select({ total: count() })
      .from(schema.groupmember)
      .where(eq(schema.groupmember.groupId, groupId));

    return row.total;
  }

  beforeAll(async () => {
    const { db, schema } = await load();
    const { createOrganization } = await import('@db/queries/organization');

    const organization = await createOrganization({ name: `bulk-insert-${suffix}` });
    organizationId = organization.id;

    const [group] = await db
      .insert(schema.group)
      .values({ name: `bulk-insert-${suffix}`, organizationId })
      .returning();
    groupId = group.id;

    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Bulk insert course', description: 'Fixture', groupId, slug: `bulk-insert-${suffix}` })
      .returning();
    courseId = course.id;

    const emails = Array.from({ length: 1201 }, (_, index) => `bulk-insert-${suffix}-${index}@bulk.test`);
    const users = await db
      .insert(schema.user)
      .values(emails.map((email) => ({ name: email, email, emailVerified: true })))
      .returning({ id: schema.user.id, email: schema.user.email });
    await db
      .insert(schema.profile)
      .values(users.map((user) => ({ id: user.id, email: user.email, fullname: user.email, username: user.email })));
    profileIds = users.map((user) => user.id);

    const [cohort] = await db
      .insert(schema.cohort)
      .values({ organizationId, name: `bulk-insert-${suffix}`, createdByProfileId: profileIds[0] })
      .returning();
    cohortId = cohort.id;
  }, 60_000);

  afterAll(async () => {
    if (!organizationId) return;

    const { db, schema, like } = await load();
    const { deleteOrganization } = await import('@db/scripts/lib/org-deletion');

    await deleteOrganization(db.$client, organizationId);
    await db.delete(schema.profile).where(like(schema.profile.email, emailPattern));
    await db.delete(schema.user).where(like(schema.user.email, emailPattern));
  }, 60_000);

  it('adds every course member in one call', async () => {
    const { addCourseMembers } = await load();

    const added = await addCourseMembers(
      courseId,
      profileIds.slice(0, 3).map((profileId) => ({ profileId, roleId: ROLE.STUDENT }))
    );

    expect(added.map((member) => member.profileId).sort()).toEqual(profileIds.slice(0, 3).sort());
    expect(await groupMemberCount()).toBe(3);
  });

  it('adds no course member when one in the list is already in the course', async () => {
    const { addCourseMembers } = await load();

    const error = await addCourseMembers(courseId, [
      { profileId: profileIds[3], roleId: ROLE.STUDENT },
      { profileId: profileIds[0], roleId: ROLE.STUDENT }
    ]).catch((caught: unknown) => caught);

    expect(isUniqueConstraintViolation(error)).toBe(true);
    expect(await groupMemberCount()).toBe(3);
  });

  it('adds course members past one insert chunk and rolls all of them back on a late duplicate', async () => {
    const { addCourseMembers } = await load();
    const newProfiles = profileIds.slice(4, 1200);

    const error = await addCourseMembers(courseId, [
      ...newProfiles.map((profileId) => ({ profileId, roleId: ROLE.STUDENT })),
      { profileId: profileIds[0], roleId: ROLE.STUDENT }
    ]).catch((caught: unknown) => caught);

    expect(isUniqueConstraintViolation(error)).toBe(true);
    expect(await groupMemberCount()).toBe(3);

    const added = await addCourseMembers(
      courseId,
      newProfiles.map((profileId) => ({ profileId, roleId: ROLE.STUDENT }))
    );

    expect(added).toHaveLength(newProfiles.length);
    expect(await groupMemberCount()).toBe(3 + newProfiles.length);
  });

  it('skips cohort members who are already in the cohort and returns only the new ones', async () => {
    const { addCohortMembers } = await load();
    const toRow = (profileId: string) => ({ cohortId, profileId, roleId: ROLE.STUDENT });

    await addCohortMembers(profileIds.slice(0, 2).map(toRow));
    const added = await addCohortMembers(profileIds.slice(0, 700).map(toRow));

    expect(added).toHaveLength(698);
    expect(added.map((member) => member.profileId)).not.toContain(profileIds[0]);
  });
});
