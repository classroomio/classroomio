import 'dotenv/config';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@api/services/course/completion', () => ({
  evaluateCourseCertification: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  syncComplianceProgressForMember: vi.fn()
}));

import { evaluateCourseCertification } from '@api/services/course/completion';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';
import {
  deliverActivityCompletionSideEffects,
  sweepActivityCompletionSideEffects
} from '@api/services/activity/activity-completion';
import {
  claimDueActivityCompletionSideEffects,
  enqueueActivityCompletionSideEffects
} from '@cio/db/queries/activity/completion-side-effect';
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

  await db
    .delete(schema.activityCompletionSideEffect)
    .where(eq(schema.activityCompletionSideEffect.profileId, fixture.profileId));
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

async function readOutboxRow(activityId: string, profileId: string) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const { and } = await import('drizzle-orm');

  const [row] = await db
    .select()
    .from(schema.activityCompletionSideEffect)
    .where(
      and(
        eq(schema.activityCompletionSideEffect.activityId, activityId),
        eq(schema.activityCompletionSideEffect.profileId, profileId)
      )
    );

  return row ?? null;
}

async function makeOutboxRowDue(activityId: string) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db
    .update(schema.activityCompletionSideEffect)
    .set({ nextAttemptAt: new Date(Date.now() - 1_000).toISOString() })
    .where(eq(schema.activityCompletionSideEffect.activityId, activityId));
}

describe.skipIf(!hasDatabase)('activity completion side-effect outbox', () => {
  afterEach(() => {
    vi.mocked(evaluateCourseCertification).mockReset();
    vi.mocked(syncComplianceProgressForMember).mockReset();
  });

  it('runs certification then compliance and clears the row', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);

      await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
      await deliverActivityCompletionSideEffects(fixture.activityId, fixture.profileId);

      expect(evaluateCourseCertification).toHaveBeenCalledWith(fixture.courseId, fixture.profileId);
      expect(syncComplianceProgressForMember).toHaveBeenCalledWith(
        fixture.courseId,
        fixture.profileId,
        'activity',
        undefined
      );
      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('commits nothing when the completion transaction rolls back', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      const { db } = await import('@db/drizzle');

      await expect(
        db.transaction(async (tx) => {
          await completeActivityOnce(fixture.activityId, fixture.profileId, tx);
          await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId], tx);
          throw new Error('rollback');
        })
      ).rejects.toThrow('rollback');

      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('survives a restart: work committed without delivery is run by the sweeper', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      const { db } = await import('@db/drizzle');
      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);

      await db.transaction(async (tx) => {
        await completeActivityOnce(fixture.activityId, fixture.profileId, tx);
        await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId], tx);
      });

      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).not.toBeNull();

      await sweepActivityCompletionSideEffects();

      expect(evaluateCourseCertification).toHaveBeenCalledWith(fixture.courseId, fixture.profileId);
      expect(syncComplianceProgressForMember).toHaveBeenCalledTimes(1);
      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('re-claims a row whose lease expired after a crash mid-run', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);

      await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
      const leaseUntil = new Date(Date.now() + 60_000).toISOString();
      const claimed = await claimDueActivityCompletionSideEffects({
        limit: 1,
        leaseUntil,
        key: { activityId: fixture.activityId, profileId: fixture.profileId }
      });
      expect(claimed).toHaveLength(1);

      await sweepActivityCompletionSideEffects();
      expect(evaluateCourseCertification).not.toHaveBeenCalled();

      await makeOutboxRowDue(fixture.activityId);
      await sweepActivityCompletionSideEffects();

      expect(evaluateCourseCertification).toHaveBeenCalledTimes(1);
      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('keeps only certification pending when certification alone fails, then retries just that', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockRejectedValueOnce(new Error('certificate service unavailable'));
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
      await deliverActivityCompletionSideEffects(fixture.activityId, fixture.profileId);
      consoleError.mockRestore();

      const pending = await readOutboxRow(fixture.activityId, fixture.profileId);
      expect(pending).toMatchObject({ certificationPending: true, compliancePending: false, attempts: 1 });
      expect(pending?.lastError).toContain('certificate service unavailable');
      expect(new Date(pending!.nextAttemptAt).getTime()).toBeGreaterThan(Date.now());
      expect(syncComplianceProgressForMember).toHaveBeenCalledTimes(1);

      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      await makeOutboxRowDue(fixture.activityId);
      await sweepActivityCompletionSideEffects();

      expect(evaluateCourseCertification).toHaveBeenCalledTimes(2);
      expect(syncComplianceProgressForMember).toHaveBeenCalledTimes(1);
      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('keeps only compliance pending when compliance alone fails, then retries just that', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
      vi.mocked(syncComplianceProgressForMember).mockRejectedValueOnce(new Error('compliance sync failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
      await deliverActivityCompletionSideEffects(fixture.activityId, fixture.profileId);
      consoleError.mockRestore();

      const pending = await readOutboxRow(fixture.activityId, fixture.profileId);
      expect(pending).toMatchObject({ certificationPending: false, compliancePending: true });
      expect(pending?.lastError).toContain('compliance sync failed');

      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);
      await makeOutboxRowDue(fixture.activityId);
      await sweepActivityCompletionSideEffects();

      expect(evaluateCourseCertification).toHaveBeenCalledTimes(1);
      expect(syncComplianceProgressForMember).toHaveBeenCalledTimes(2);
      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toBeNull();
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });

  it('keeps a row that was re-enqueued while a run was in flight', async () => {
    const fixture = await createCompletionFixture(`${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);
    try {
      vi.mocked(syncComplianceProgressForMember).mockResolvedValue(null);
      vi.mocked(evaluateCourseCertification).mockImplementationOnce(async () => {
        await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
        return { eligibleForCertificate: false } as never;
      });

      await enqueueActivityCompletionSideEffects(fixture.activityId, [fixture.profileId]);
      await deliverActivityCompletionSideEffects(fixture.activityId, fixture.profileId);

      expect(await readOutboxRow(fixture.activityId, fixture.profileId)).toMatchObject({
        certificationPending: true,
        compliancePending: true,
        generation: 1
      });
    } finally {
      await cleanupCompletionFixture(fixture);
    }
  });
});
