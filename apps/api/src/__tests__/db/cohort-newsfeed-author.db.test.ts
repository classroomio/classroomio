import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { ROLE } from '@cio/utils/constants';

import { createCohortNewsfeedService } from '@api/services/cohort/cohort';
import { ErrorCodes } from '@api/utils/errors';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

type Fixture = {
  orgId: string;
  cohortId: string;
  orgAdminId: string;
  studentId: string;
  outsiderId: string;
};

describe.skipIf(!shouldRun)('cohort newsfeed authorship (database)', () => {
  let fixture: Fixture;

  async function createPerson(emailPrefix: string): Promise<string> {
    const profileId = randomUUID();
    const email = `${emailPrefix}-${profileId}@example.com`;

    await db.insert(schema.user).values({ id: profileId, name: emailPrefix, email });
    await db.insert(schema.profile).values({
      id: profileId,
      fullname: emailPrefix,
      username: `${emailPrefix}-${profileId.slice(0, 8)}`,
      email
    });

    return profileId;
  }

  async function createFixture(): Promise<Fixture> {
    const orgId = randomUUID();
    const orgAdminId = await createPerson('cohort-feed-admin');
    const studentId = await createPerson('cohort-feed-student');
    const outsiderId = await createPerson('cohort-feed-outsider');

    await db.insert(schema.organization).values({ id: orgId, name: `Cohort feed test ${orgId.slice(0, 8)}` });
    await db.insert(schema.organizationmember).values({
      organizationId: orgId,
      roleId: ROLE.ADMIN,
      profileId: orgAdminId,
      email: `cohort-feed-admin-${orgAdminId}@example.com`,
      status: 'ACTIVE',
      verified: true
    });

    const [createdCohort] = await db
      .insert(schema.cohort)
      .values({ organizationId: orgId, name: `Cohort feed test ${orgId.slice(0, 8)}` })
      .returning({ id: schema.cohort.id });

    return { orgId, cohortId: createdCohort.id, orgAdminId, studentId, outsiderId };
  }

  async function cleanup(current: Fixture): Promise<void> {
    await db.delete(schema.cohort).where(eq(schema.cohort.id, current.cohortId));
    await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, current.orgId));
    await db.delete(schema.organization).where(eq(schema.organization.id, current.orgId));
    await db.delete(schema.profile).where(eq(schema.profile.id, current.orgAdminId));
    await db.delete(schema.profile).where(eq(schema.profile.id, current.studentId));
    await db.delete(schema.profile).where(eq(schema.profile.id, current.outsiderId));
    await db.delete(schema.user).where(eq(schema.user.id, current.orgAdminId));
    await db.delete(schema.user).where(eq(schema.user.id, current.studentId));
    await db.delete(schema.user).where(eq(schema.user.id, current.outsiderId));
  }

  function cohortMemberRows(profileId: string) {
    return db
      .select()
      .from(schema.cohortMember)
      .where(and(eq(schema.cohortMember.cohortId, fixture.cohortId), eq(schema.cohortMember.profileId, profileId)));
  }

  beforeAll(async () => {
    await db
      .insert(schema.role)
      .values([
        { id: ROLE.ADMIN, type: 'admin' },
        { id: ROLE.TUTOR, type: 'tutor' },
        { id: ROLE.STUDENT, type: 'student' }
      ])
      .onConflictDoNothing();
  });

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await cleanup(fixture);
  });

  it('adds an org admin to the cohort and authors the post as them', async () => {
    const feed = await createCohortNewsfeedService(fixture.cohortId, fixture.orgAdminId, { content: 'Hello cohort' });

    const [member] = await cohortMemberRows(fixture.orgAdminId);

    expect(member).toBeDefined();
    expect(member!.roleId).toBe(ROLE.ADMIN);
    expect(feed.authorId).toBe(member!.id);
  });

  it('reuses the membership an org admin gained on their first post', async () => {
    const firstFeed = await createCohortNewsfeedService(fixture.cohortId, fixture.orgAdminId, { content: 'First' });
    const secondFeed = await createCohortNewsfeedService(fixture.cohortId, fixture.orgAdminId, { content: 'Second' });

    const members = await cohortMemberRows(fixture.orgAdminId);

    expect(members).toHaveLength(1);
    expect(secondFeed.authorId).toBe(firstFeed.authorId);
  });

  it("keeps an existing student's cohort role when they author a post", async () => {
    const [studentMember] = await db
      .insert(schema.cohortMember)
      .values({ cohortId: fixture.cohortId, profileId: fixture.studentId, roleId: ROLE.STUDENT })
      .returning();

    const feed = await createCohortNewsfeedService(fixture.cohortId, fixture.studentId, { content: 'Hi' });

    const [member] = await cohortMemberRows(fixture.studentId);

    expect(feed.authorId).toBe(studentMember.id);
    expect(member!.roleId).toBe(ROLE.STUDENT);
  });

  it('refuses a profile that is neither a cohort member nor an org admin', async () => {
    await expect(
      createCohortNewsfeedService(fixture.cohortId, fixture.outsiderId, { content: 'Hi' })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.COHORT_FORBIDDEN });

    const feeds = await db
      .select()
      .from(schema.cohortNewsfeed)
      .where(eq(schema.cohortNewsfeed.cohortId, fixture.cohortId));
    const members = await cohortMemberRows(fixture.outsiderId);

    expect(feeds).toHaveLength(0);
    expect(members).toHaveLength(0);
  });
});
