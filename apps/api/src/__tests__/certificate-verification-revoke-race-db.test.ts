import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.skipIf(!hasDatabase)('revoking a certificate issued during a reset or removal', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let organizationId = '';
  let groupId = '';
  let courseId = '';
  let profileId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const email = `student-${suffix}@certificate-race.test`;

    const [organization] = await db
      .insert(schema.organization)
      .values({ name: `certificate-race-${suffix}` })
      .returning();
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Certificate race', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Certificate race', description: 'Certificate race', groupId: group.id })
      .returning();
    const [userRow] = await db.insert(schema.user).values({ name: 'student', email, emailVerified: true }).returning();
    await db
      .insert(schema.profile)
      .values({ id: userRow.id, fullname: 'student', username: `student-${suffix}`, email });

    organizationId = organization.id;
    groupId = group.id;
    courseId = course.id;
    profileId = userRow.id;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db
      .delete(schema.courseCertificateVerification)
      .where(eq(schema.courseCertificateVerification.courseId, courseId));
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, groupId));
    await db.delete(schema.course).where(eq(schema.course.id, courseId));
    await db.delete(schema.group).where(eq(schema.group.id, groupId));
    await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    await db.delete(schema.profile).where(eq(schema.profile.id, profileId));
    await db.delete(schema.user).where(eq(schema.user.id, profileId));
  });

  async function raceIssuanceWith(remove: (groupMemberId: string) => Promise<unknown>) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { claimMemberCertificateEarned } = await import('@db/queries/course/people');
    const { createCourseCertificateVerification } = await import('@db/queries/course/certificate-verification');

    const [member] = await db
      .insert(schema.groupmember)
      .values({ groupId, profileId, roleId: ROLE.STUDENT })
      .returning();
    let verificationId = '';

    const issuance = db.transaction(async (tx) => {
      const earnedAt = new Date().toISOString();
      await claimMemberCertificateEarned(member.id, earnedAt, tx);
      const verification = await createCourseCertificateVerification(
        { courseId, profileId, groupMemberId: member.id, issuedAt: earnedAt },
        tx
      );
      verificationId = verification!.id;
      await tx.execute(sql`select pg_sleep(1)`);
    });

    await wait(300);
    await Promise.all([issuance, remove(member.id)]);

    const [verification] = await db
      .select({ revokedAt: schema.courseCertificateVerification.revokedAt })
      .from(schema.courseCertificateVerification)
      .where(eq(schema.courseCertificateVerification.id, verificationId));
    await db.delete(schema.groupmember).where(eq(schema.groupmember.id, member.id));

    return verification;
  }

  it('revokes it when the reset starts while the certificate is being issued', async () => {
    const { resetStudentCourseProgress } = await import('@db/queries/course/reset-progress');

    const verification = await raceIssuanceWith((groupMemberId) =>
      resetStudentCourseProgress({ courseId, groupMemberId, profileId })
    );

    expect(verification.revokedAt).not.toBeNull();
  });

  it('revokes it when the org removal starts while the certificate is being issued', async () => {
    const { db } = await import('@db/drizzle');
    const { deleteGroupMembershipsForOrgProfiles } = await import('@db/queries/organization/organization');

    const verification = await raceIssuanceWith(() =>
      db.transaction((tx) => deleteGroupMembershipsForOrgProfiles(organizationId, [profileId], tx))
    );

    expect(verification.revokedAt).not.toBeNull();
  });
});
