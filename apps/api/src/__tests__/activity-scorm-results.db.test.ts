import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type ResultsFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  activityId: string;
  profileId: string;
  groupMemberId: string;
  versionId: string;
  unitIds: string[];
};

async function createResultsFixture(suffix: string): Promise<ResultsFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `scorm-results-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `scorm-results-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'SCORM results',
      description: 'Results, attempts and reset coverage',
      groupId: group.id,
      slug: `scorm-results-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1 })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id });
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      isCurrent: true,
      status: 'ready',
      format: 'scorm12',
      uploadKey: `zip/${suffix}.zip`,
      contentPrefix: `scorm/${suffix}/v1`
    })
    .returning();
  const units = await db
    .insert(schema.contentPackageUnit)
    .values([
      {
        packageVersionId: version.id,
        identifier: 'sco-graded',
        title: 'Graded module',
        position: 0,
        unitType: 'sco',
        href: 'quiz.html',
        masteryScore: '80'
      },
      {
        packageVersionId: version.id,
        identifier: 'sco-plain',
        title: 'Plain module',
        position: 1,
        unitType: 'sco',
        href: 'content.html'
      }
    ])
    .returning();

  const userId = crypto.randomUUID();
  await db
    .insert(schema.user)
    .values({ id: userId, name: `Scorm Results ${suffix}`, email: `sr-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: userId,
    fullname: `Scorm Results ${suffix}`,
    username: `scorm-results-${suffix}`,
    email: `sr-${suffix}@example.com`
  });
  const [member] = await db
    .insert(schema.groupmember)
    .values({ groupId: group.id, roleId: 3, profileId: userId, email: `sr-${suffix}@example.com` })
    .returning();

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    activityId: activity.id,
    profileId: userId,
    groupMemberId: member.id,
    versionId: version.id,
    unitIds: units.map((unit) => unit.id)
  };
}

async function cleanupResultsFixture(ids: ResultsFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, ids.profileId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, ids.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, ids.orgId));
  await db.delete(schema.course).where(eq(schema.course.id, ids.courseId));
  await db.delete(schema.groupmember).where(eq(schema.groupmember.id, ids.groupMemberId));
  await db.delete(schema.organizationmember).where(eq(schema.organizationmember.profileId, ids.profileId));
  await db.delete(schema.group).where(eq(schema.group.id, ids.groupId));
  await db.delete(schema.profile).where(eq(schema.profile.id, ids.profileId));
  await db.delete(schema.user).where(eq(schema.user.id, ids.profileId));
  await db.delete(schema.organization).where(eq(schema.organization.id, ids.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe.skipIf(!hasDatabase)('scorm outcome mapping parity', () => {
  it('matches the TypeScript mapping on shared CMI samples', { timeout: 30000 }, async () => {
    const { evaluateTryOutcome } = await import('@db/queries/scorm/outcome');
    const { moduleOutcomeFromCmi } = await import('@cio/activity-packages');

    const samples: Array<{
      cmi: Record<string, unknown>;
      format: 'scorm12' | 'scorm2004_4';
      masteryScore: number | null;
      scaledPassingScore: number | null;
    }> = [
      { cmi: { core: { lesson_status: 'passed' } }, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      {
        cmi: { core: { lesson_status: 'completed' } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      { cmi: { core: { lesson_status: 'failed' } }, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      {
        cmi: { core: { lesson_status: 'incomplete' } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      { cmi: { core: { lesson_status: 'browsed' } }, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      {
        cmi: { core: { lesson_status: 'not attempted' } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      { cmi: { core: {} }, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      { cmi: {}, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      {
        cmi: { core: { lesson_status: 'weird-status' } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      { cmi: { core: { lesson_status: 'PASSED' } }, format: 'scorm12', masteryScore: null, scaledPassingScore: null },
      {
        cmi: { core: { lesson_status: '', score: { raw: '85' } } },
        format: 'scorm12',
        masteryScore: 80,
        scaledPassingScore: null
      },
      {
        cmi: { core: { lesson_status: 'completed', score: { raw: '70', min: '0', max: '100' } } },
        format: 'scorm12',
        masteryScore: 80,
        scaledPassingScore: null
      },
      {
        cmi: { core: { score: { raw: '30', min: '10', max: '110' } } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      {
        cmi: { core: { score: { raw: 'not-a-number' } } },
        format: 'scorm12',
        masteryScore: null,
        scaledPassingScore: null
      },
      {
        cmi: { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
        format: 'scorm2004_4',
        masteryScore: null,
        scaledPassingScore: 0.8
      },
      {
        cmi: { completion_status: 'incomplete', success_status: 'failed' },
        format: 'scorm2004_4',
        masteryScore: null,
        scaledPassingScore: null
      },
      {
        cmi: { completion_status: 'COMPLETED', success_status: '' },
        format: 'scorm2004_4',
        masteryScore: null,
        scaledPassingScore: null
      },
      { cmi: {}, format: 'scorm2004_4', masteryScore: null, scaledPassingScore: null }
    ];

    for (const sample of samples) {
      const fromSql = await evaluateTryOutcome(sample);
      const fromTs = moduleOutcomeFromCmi(sample.cmi, sample.format, {
        masteryScore: sample.masteryScore,
        formatDetails: {
          scaledPassingScore: sample.scaledPassingScore,
          completionThreshold: null,
          maxTimeAllowed: null,
          timeLimitAction: null
        }
      });

      expect(fromSql, JSON.stringify(sample)).toEqual({
        completion: fromTs.completion,
        success: fromTs.success,
        scaledScore: fromTs.scaledScore,
        hasPassMark: fromTs.hasPassMark
      });
    }
  });
});

describe.skipIf(!hasDatabase)('scorm results and reset', () => {
  it(
    'lists learner rows with scores, agrees with the TypeScript rule, and summarizes',
    { timeout: 30000 },
    async () => {
      const ids = await createResultsFixture(suffix());
      try {
        const { db } = await import('@db/drizzle');
        const schema = await import('@db/schema');
        const { listScormResults } = await import('@cio/core/services/activity/providers/scorm/results');
        const { isScormRuleMet } = await import('@cio/activity-packages');

        const [attempt] = await db
          .insert(schema.scormAttempt)
          .values({
            activityId: ids.activityId,
            profileId: ids.profileId,
            packageVersionId: ids.versionId,
            attemptNumber: 1
          })
          .returning();
        await db.insert(schema.scormScoAttempt).values([
          {
            attemptId: attempt!.id,
            unitId: ids.unitIds[0]!,
            status: 'closed',
            cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
            commitSeq: 3,
            lastCommitAt: new Date().toISOString(),
            terminatedAt: new Date().toISOString()
          },
          {
            attemptId: attempt!.id,
            unitId: ids.unitIds[1]!,
            status: 'closed',
            cmi: { core: { lesson_status: 'completed' } },
            commitSeq: 2,
            lastCommitAt: new Date().toISOString(),
            terminatedAt: new Date().toISOString()
          }
        ]);
        await db.insert(schema.activityCompletion).values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          isComplete: true,
          completedAt: new Date().toISOString()
        });

        const { summary, learners, total } = await listScormResults(ids.activityId, [ids.profileId], {
          page: 1,
          limit: 20,
          sort: 'name',
          direction: 'asc'
        });

        expect(total).toBe(1);
        expect(learners).toHaveLength(1);

        const learner = learners[0]!;
        expect(learner.attempts).toBe(1);
        expect(learner.status).toBe('completed');
        expect(learner.passFail).toBe('passed');
        expect(learner.scorePercent).toBe(90);
        expect(learner.bestScorePercent).toBe(90);

        const ruleMet = isScormRuleMet({ rule: 'auto', minScorePercent: null }, [
          { completion: 'completed', success: 'passed', hasPassMark: true, scaledScore: 0.9 },
          { completion: 'completed', success: 'unknown', hasPassMark: false, scaledScore: null }
        ]);
        expect(ruleMet).toBe(true);

        expect(summary).toEqual({ enrolled: 1, started: 1, completed: 1, passed: 1, averageScore: 90 });
      } finally {
        await cleanupResultsFixture(ids);
      }
    }
  );

  it('resets attempts and completions, and counts attempts in the impact', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { resetActivityLearner } = await import('@cio/core/services/activity/activity');
      const { getStudentCourseProgressImpactCounts } = await import('@db/queries/course/reset-progress');

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0]!,
        status: 'suspended',
        cmi: { core: { lesson_status: 'incomplete' } },
        commitSeq: 1,
        lastCommitAt: new Date().toISOString()
      });
      await db.insert(schema.activityCompletion).values({
        activityId: ids.activityId,
        profileId: ids.profileId,
        isComplete: false
      });

      const impact = await getStudentCourseProgressImpactCounts({
        courseId: ids.courseId,
        groupMemberId: ids.groupMemberId,
        profileId: ids.profileId
      });

      expect(impact.activityAttempts).toBe(1);
      expect(impact.completedActivities).toBe(0);
      expect(impact.totalActivities).toBe(1);

      const reset = await resetActivityLearner(ids.courseId, ids.activityId, ids.profileId);

      expect(reset.attempts).toBe(1);
      expect(reset.completions).toBe(1);

      const remainingAttempts = await db
        .select()
        .from(schema.scormAttempt)
        .where(eq(schema.scormAttempt.profileId, ids.profileId));
      const remainingTries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempt!.id));
      const remainingCompletions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.profileId, ids.profileId));

      expect(remainingAttempts).toHaveLength(0);
      expect(remainingTries).toHaveLength(0);
      expect(remainingCompletions).toHaveLength(0);
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('snapshots best score, attempt count and minutes for compliance', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { getComplianceSnapshot } = await import('@cio/core/services/activity/providers/scorm/results');

      const base = Date.parse('2026-01-01T00:00:00.000Z');
      const iso = (offsetMs: number) => new Date(base + offsetMs).toISOString();
      const [first] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1,
          startedAt: iso(0),
          closedAt: iso(160_000),
          closeReason: 'finished'
        })
        .returning();
      const [second] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 2,
          startedAt: iso(200_000)
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values([
        {
          attemptId: first!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '80' } } },
          commitSeq: 2,
          startedAt: iso(0),
          lastCommitAt: iso(150_000),
          terminatedAt: iso(150_000)
        },
        {
          attemptId: second!.id,
          unitId: ids.unitIds[0]!,
          status: 'closed',
          cmi: { core: { lesson_status: 'passed', score: { raw: '90' } } },
          commitSeq: 1,
          startedAt: iso(200_000),
          lastCommitAt: iso(260_000),
          terminatedAt: iso(260_000)
        }
      ]);

      const snapshot = await getComplianceSnapshot(ids.activityId, ids.profileId);

      expect(snapshot).toEqual({ score: 90, attempts: 2, minutes: 3 });

      const empty = await getComplianceSnapshot(ids.activityId, crypto.randomUUID());

      expect(empty).toBeNull();
    } finally {
      await cleanupResultsFixture(ids);
    }
  });

  it('reconciles last active from SCORM commits alone', { timeout: 30000 }, async () => {
    const ids = await createResultsFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { reconcileMemberLastActive } = await import('@db/queries/organization/member-lifecycle');

      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: ids.activityId,
          profileId: ids.profileId,
          packageVersionId: ids.versionId,
          attemptNumber: 1
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: ids.unitIds[0]!,
        status: 'active',
        cmi: {},
        commitSeq: 1,
        lastCommitAt: new Date().toISOString()
      });
      await db.insert(schema.organizationmember).values({
        organizationId: ids.orgId,
        roleId: 3,
        profileId: ids.profileId,
        email: `sr-${ids.profileId}@example.com`
      });

      const updated = await reconcileMemberLastActive(30);

      expect(updated).toBeGreaterThanOrEqual(1);

      const [member] = await db
        .select()
        .from(schema.organizationmember)
        .where(eq(schema.organizationmember.profileId, ids.profileId));

      expect(member?.lastActiveAt).not.toBeNull();
    } finally {
      await cleanupResultsFixture(ids);
    }
  });
});
