import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type StudentKey = 'active' | 'archived' | 'noOrgMember' | 'tutorNoOrgMember' | 'archivedTutor' | 'deleted';
// noOrgMember stands in for a student deleted before this fix: a leftover cohort row with no org membership.
const STUDENTS: Array<{ key: StudentKey; orgStatus: 'ACTIVE' | 'ARCHIVED' | null; cohortRoleId?: number }> = [
  { key: 'active', orgStatus: 'ACTIVE' },
  { key: 'archived', orgStatus: 'ARCHIVED' },
  { key: 'noOrgMember', orgStatus: null },
  { key: 'tutorNoOrgMember', orgStatus: null, cohortRoleId: ROLE.TUTOR },
  { key: 'archivedTutor', orgStatus: 'ARCHIVED', cohortRoleId: ROLE.TUTOR },
  { key: 'deleted', orgStatus: 'ACTIVE' }
];

describe.skipIf(!hasDatabase)('cohort access follows org member status', () => {
  const suffix = Date.now();
  const profileIdByKey = new Map<StudentKey, string>();
  const orgMemberIdByKey = new Map<StudentKey, number>();
  let organizationId = '';
  let cohortId = '';

  const profileId = (key: StudentKey) => profileIdByKey.get(key)!;

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `cohort-access-${suffix}` });
    organizationId = organization.id;

    const [cohortRow] = await db
      .insert(schema.cohort)
      .values({ organizationId, name: `cohort-${suffix}` })
      .returning({ id: schema.cohort.id });
    cohortId = cohortRow.id;

    for (const student of STUDENTS) {
      const email = `${student.key.toLowerCase()}-${suffix}@cohort-access.test`;
      const [userRow] = await db
        .insert(schema.user)
        .values({ name: student.key, email, emailVerified: true })
        .returning();
      await db
        .insert(schema.profile)
        .values({ id: userRow.id, fullname: student.key, username: `${student.key}-${suffix}`, email });
      profileIdByKey.set(student.key, userRow.id);

      await db
        .insert(schema.cohortMember)
        .values({ cohortId, profileId: userRow.id, roleId: student.cohortRoleId ?? ROLE.STUDENT, email });

      if (student.orgStatus) {
        const [memberRow] = await db
          .insert(schema.organizationmember)
          .values({
            organizationId,
            roleId: ROLE.STUDENT,
            profileId: userRow.id,
            email,
            status: student.orgStatus,
            verified: true
          })
          .returning({ id: schema.organizationmember.id });
        orgMemberIdByKey.set(student.key, memberRow.id);
      }
    }
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const profileIds = [...profileIdByKey.values()];

    if (organizationId) {
      await db.delete(schema.cohort).where(eq(schema.cohort.organizationId, organizationId));
      await db.delete(schema.organizationmember).where(eq(schema.organizationmember.organizationId, organizationId));
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    if (profileIds.length > 0) {
      await db.delete(schema.profile).where(inArray(schema.profile.id, profileIds));
      await db.delete(schema.user).where(inArray(schema.user.id, profileIds));
    }
  });

  it('lets active students and staff in, and keeps archived students and students with no org membership out', async () => {
    const { isCohortMember } = await import('@db/queries/cohort');

    expect(await isCohortMember(cohortId, profileId('active'))).toBe(true);
    expect(await isCohortMember(cohortId, profileId('tutorNoOrgMember'))).toBe(true);
    expect(await isCohortMember(cohortId, profileId('archived'))).toBe(false);
    expect(await isCohortMember(cohortId, profileId('noOrgMember'))).toBe(false);
    expect(await isCohortMember(cohortId, profileId('archivedTutor'))).toBe(false);
  });

  it('hides the cohort from an archived student but still finds the row for duplicate checks', async () => {
    const { findCohortMemberRowByProfileId, getCohortsByOrgForProfile, getEnrolledCohortsByProfile } = await import(
      '@db/queries/cohort'
    );

    expect((await getEnrolledCohortsByProfile(profileId('active'))).map((c) => c.id)).toEqual([cohortId]);
    expect(await getEnrolledCohortsByProfile(profileId('archived'))).toEqual([]);
    expect(await getEnrolledCohortsByProfile(profileId('noOrgMember'))).toEqual([]);
    expect(await getCohortsByOrgForProfile(organizationId, profileId('archived'))).toEqual([]);
    expect(await findCohortMemberRowByProfileId(cohortId, profileId('archived'))).not.toBeNull();
  });

  it('gives the cohort back after unarchive', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { isCohortMember } = await import('@db/queries/cohort');

    await db
      .update(schema.organizationmember)
      .set({ status: 'ACTIVE' })
      .where(eq(schema.organizationmember.id, orgMemberIdByKey.get('archived')!));

    expect(await isCohortMember(cohortId, profileId('archived'))).toBe(true);
  });

  it('removes the cohort row when the student is deleted, keeping their posts without an author', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { deleteOrganizationAudienceMember } = await import('@db/queries/organization');
    const { findCohortMemberRowByProfileId } = await import('@db/queries/cohort');

    const authorRow = await findCohortMemberRowByProfileId(cohortId, profileId('deleted'));
    const [post] = await db
      .insert(schema.cohortNewsfeed)
      .values({ cohortId, authorId: authorRow!.id, content: 'post' })
      .returning({ id: schema.cohortNewsfeed.id });
    const [comment] = await db
      .insert(schema.cohortNewsfeedComment)
      .values({ cohortNewsfeedId: post.id, authorId: authorRow!.id, content: 'comment' })
      .returning({ id: schema.cohortNewsfeedComment.id });

    await deleteOrganizationAudienceMember(organizationId, orgMemberIdByKey.get('deleted')!);

    expect(await findCohortMemberRowByProfileId(cohortId, profileId('deleted'))).toBeNull();
    expect(await findCohortMemberRowByProfileId(cohortId, profileId('active'))).not.toBeNull();

    const [postAfter] = await db.select().from(schema.cohortNewsfeed).where(eq(schema.cohortNewsfeed.id, post.id));
    const [commentAfter] = await db
      .select()
      .from(schema.cohortNewsfeedComment)
      .where(eq(schema.cohortNewsfeedComment.id, comment.id));
    expect(postAfter.authorId).toBeNull();
    expect(commentAfter.authorId).toBeNull();
  });
});
