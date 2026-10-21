import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@api/services/course/completion', () => ({
  evaluateCourseCertification: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  syncComplianceProgressForMember: vi.fn()
}));

import { evaluateCourseCertification } from '@api/services/course/completion';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';
import { runActivityCompletionSideEffects } from '@api/services/activity/activity-completion';
import { completeActivityOnce } from '@cio/core/services/activity/activity';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

async function createCompletionFixture(suffix: string) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-complete-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-complete-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Completion baseline',
      description: 'Activity completion characterization',
      groupId: group.id,
      slug: `char-complete-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();

  const userId = crypto.randomUUID();
  await db.insert(schema.user).values({
    id: userId,
    name: `Complete ${suffix}`,
    email: `complete-${suffix}@example.com`
  });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Complete ${suffix}`,
    username: `complete-${suffix}`,
    email: `complete-${suffix}@example.com`
  });

  return { orgId: organization.id, groupId: group.id, courseId: course.id, activityId: activity.id, profileId: userId };
}

async function cleanupCompletionFixture(fixture: Awaited<ReturnType<typeof createCompletionFixture>>) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.profileId));
}

describe.skipIf(!hasDatabase)('completeActivityOnce (zero-activity baseline plus one)', () => {
  it('flips the first completion and ignores repeats', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      expect(await completeActivityOnce(fixture.activityId, fixture.profileId)).toBe(true);
      expect(await completeActivityOnce(fixture.activityId, fixture.profileId)).toBe(false);
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('completes inside the caller transaction', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      const { db } = await import('@db/drizzle');

      const flipped = await db.transaction((tx) => completeActivityOnce(fixture.activityId, fixture.profileId, tx));

      expect(flipped).toBe(true);
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('runActivityCompletionSideEffects (zero-activity baseline plus one)', () => {
  it('evaluates certification then syncs compliance for the activity course', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);

      await runActivityCompletionSideEffects(fixture.activityId, fixture.profileId);

      expect(evaluateCourseCertification).toHaveBeenCalledWith(fixture.courseId, fixture.profileId);
      expect(syncComplianceProgressForMember).toHaveBeenCalledWith(
        fixture.courseId,
        fixture.profileId,
        'activity',
        undefined
      );
    } finally {
      await cleanupCompletionFixture(fixture);
      vi.clearAllMocks();
    }
  });

  it('throws 404 for a deleted activity instead of certifying', async () => {
    await expect(runActivityCompletionSideEffects(crypto.randomUUID(), crypto.randomUUID())).rejects.toMatchObject({
      statusCode: 404
    });
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('still syncs compliance when certification evaluation throws', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockRejectedValue(new Error('certificate service unavailable'));
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);

      await runActivityCompletionSideEffects(fixture.activityId, fixture.profileId);

      expect(evaluateCourseCertification).toHaveBeenCalledWith(fixture.courseId, fixture.profileId);
      expect(syncComplianceProgressForMember).toHaveBeenCalledWith(
        fixture.courseId,
        fixture.profileId,
        'activity',
        undefined
      );
    } finally {
      await cleanupCompletionFixture(fixture);
      vi.clearAllMocks();
    }
  });
});
