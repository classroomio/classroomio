import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret' };
});

import { launchActivity } from '@cio/core/services/activity/activity';
import { makeScormPackageVersionCurrent } from '@cio/core/services/activity/packages';
import { commitScormAttempt, getScormRuntimeState } from '@api/services/activity/runtime-scorm';
import { ZScormCommit } from '@cio/utils/validation/activity/scorm';
import { AppError } from '@api/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type UnitDef = {
  identifier: string;
  title: string;
  href: string;
  masteryScoreRaw?: number | null;
  passingScoreScaled?: number | null;
  completionThreshold?: number | null;
};

type FixtureOptions = {
  format?: 'scorm12' | 'scorm2004_2' | 'scorm2004_3' | 'scorm2004_4';
  units?: UnitDef[];
  courseType?: 'SELF_PACED' | 'COMPLIANCE';
  courseFormat?: 'standard' | 'single_activity';
  certificate?: Record<string, unknown> | null;
  compliance?: { retakeIntervalMonths: number } | null;
  withPlan?: boolean;
  allowRetakes?: boolean;
};

type RuntimeFixture = {
  orgId: string;
  courseId: string;
  activityId: string;
  assetId: string;
  versionId: string;
  unitIds: Record<string, string>;
  studentId: string;
};

async function createRuntimeFixture(suffix: string, options: FixtureOptions = {}): Promise<RuntimeFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');
  const {
    format = 'scorm12',
    units = [
      { identifier: 'mod-1', title: 'Module one', href: 'mod1.html' },
      { identifier: 'mod-2', title: 'Module two', href: 'mod2.html' }
    ],
    courseType = 'SELF_PACED',
    courseFormat = 'standard',
    certificate = null,
    compliance = null,
    withPlan = false,
    allowRetakes = false
  } = options;
  const studentId = crypto.randomUUID();

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `rt-${suffix}`, siteName: `rt-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `rt-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Runtime course',
      description: 'PR 10 run-time',
      groupId: group.id,
      slug: `rt-${suffix}`,
      type: courseType as never,
      format: courseFormat as never,
      status: 'ACTIVE',
      isPublished: true,
      certificate,
      compliance,
      metadata: {}
    })
    .returning();
  await db.insert(schema.user).values({ id: studentId, name: `Rt ${suffix}`, email: `rt-${suffix}@example.com` });
  await db.insert(schema.profile).values({
    id: studentId,
    fullname: `Rt ${suffix}`,
    username: `rt-${suffix}`,
    email: `rt-${suffix}@example.com`
  });
  await db.insert(schema.groupmember).values({
    groupId: group.id,
    roleId: 3,
    profileId: studentId,
    email: `rt-${suffix}@example.com`
  });
  if (withPlan) {
    await db.insert(schema.organizationPlan).values({
      orgId: organization.id,
      planName: 'EARLY_ADOPTER' as never,
      isActive: true
    });
  }
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({ courseId: course.id, kind: 'scorm', title: 'Package', order: 1, isUnlocked: true })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ organizationId: organization.id, kind: 'scorm', title: 'Package zip' })
    .returning();
  const [version] = await db
    .insert(schema.contentPackageVersion)
    .values({
      assetId: asset.id,
      versionNumber: 1,
      status: 'ready',
      isCurrent: true,
      format,
      uploadKey: `scorm/rt-${suffix}/v1.zip`,
      contentPrefix: `scorm/rt-${suffix}/v1`
    })
    .returning();
  await db.insert(schema.activityScorm).values({ activityId: activity.id, assetId: asset.id, allowRetakes });
  const unitIds: Record<string, string> = {};
  let position = 0;
  for (const unit of units) {
    const [row] = await db
      .insert(schema.contentPackageUnit)
      .values({
        packageVersionId: version.id,
        identifier: unit.identifier,
        title: unit.title,
        position: position++,
        unitType: 'sco',
        href: unit.href,
        masteryScoreRaw: unit.masteryScoreRaw == null ? null : String(unit.masteryScoreRaw),
        passingScoreScaled: unit.passingScoreScaled == null ? null : String(unit.passingScoreScaled),
        completionThreshold: unit.completionThreshold == null ? null : String(unit.completionThreshold)
      })
      .returning();
    unitIds[unit.identifier] = row.id;
  }

  return {
    orgId: organization.id,
    courseId: course.id,
    activityId: activity.id,
    assetId: asset.id,
    versionId: version.id,
    unitIds,
    studentId
  };
}

async function cleanupRuntimeFixture(fixture: RuntimeFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.activityCompletion).where(eq(schema.activityCompletion.profileId, fixture.studentId));
  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.asset).where(eq(schema.asset.organizationId, fixture.orgId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  const groups = await db
    .select({ id: schema.group.id })
    .from(schema.group)
    .where(eq(schema.group.organizationId, fixture.orgId));
  for (const group of groups) {
    await db.delete(schema.groupmember).where(eq(schema.groupmember.groupId, group.id));
    await db.delete(schema.group).where(eq(schema.group.id, group.id));
  }
  await db.delete(schema.organizationPlan).where(eq(schema.organizationPlan.orgId, fixture.orgId));
  await db.delete(schema.profile).where(eq(schema.profile.id, fixture.studentId));
  await db.delete(schema.user).where(eq(schema.user.id, fixture.studentId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function launchTokenOf(playerUrl: string): string {
  const marker = '/activity/player/';
  return playerUrl.slice(playerUrl.indexOf(marker) + marker.length);
}

async function listAttempts(activityId: string, profileId: string) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  return db
    .select()
    .from(schema.scormAttempt)
    .where(eq(schema.scormAttempt.activityId, activityId))
    .then((rows) => rows.filter((row) => row.profileId === profileId));
}

describe('activity commit validation', () => {
  it('accepts the scorm-again wire shape and rejects envelopes without a sequence', () => {
    expect(ZScormCommit.safeParse({ commitSequence: 1, cmi: { core: { lesson_status: 'completed' } } }).success).toBe(
      true
    );
    expect(ZScormCommit.safeParse({ seq: 2, cmi: {}, terminate: true }).success).toBe(true);
    expect(ZScormCommit.safeParse({ cmi: {} }).success).toBe(false);
    expect(ZScormCommit.safeParse({ commitSequence: -1, cmi: {} }).success).toBe(false);
    expect(ZScormCommit.safeParse('not json').success).toBe(false);
  });
});

describe.skipIf(!hasDatabase)('scorm launch and run-time (PR 10 server)', () => {
  it('launches the first module on attempt 1 without a plan check', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const launched = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        {},
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );

      expect(launched.available).toBe(true);
      if (!launched.available) throw new Error('launch unavailable');
      expect(launched.mode).toBe('normal');
      expect(launched.playerUrl).toContain('/activity/player/');
      expect(launched.unit.identifier).toBe('mod-1');
      expect(launched.units).toHaveLength(2);
      expect(launched.units.every((unit) => unit.completed === false)).toBe(true);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.attemptNumber).toBe(1);
      expect(attempts[0]?.packageVersionId).toBe(fixture.versionId);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('reuses the open attempt and try on relaunch', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      const second = await launchActivity(fixture.courseId, fixture.activityId, {}, context);

      expect(first.available && second.available).toBe(true);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const tries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempts[0]!.id));
      expect(tries).toHaveLength(1);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('resumes suspend data and location with a resume entry', async () => {
    const sfx = suffix();
    const fixture = await createRuntimeFixture(sfx);
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!first.available) throw new Error('launch unavailable');

      await commitScormAttempt(launchTokenOf(first.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_location': 'page-4', suspend_data: 'bookmark=3', 'core.exit': 'suspend' },
        terminate: true
      });

      const second = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!second.available) throw new Error('launch unavailable');
      const state = await getScormRuntimeState(launchTokenOf(second.playerUrl));

      expect(state.format).toBe('scorm12');
      expect(state.cmi).toMatchObject({ core: { lesson_location: 'page-4' }, suspend_data: 'bookmark=3' });
      expect(state.entry).toBe('resume');
      expect(state.launchPath).toBe('mod1.html');
      expect(state.parentOrigin.startsWith('http')).toBe(true);
      const parentOrigins = state.parentOrigins ?? [];
      expect(parentOrigins.length).toBeGreaterThanOrEqual(2);
      expect(parentOrigins).toContain(`https://rt-${sfx}.myclassroomio.com`);
      expect(parentOrigins).toContain(state.parentOrigin);
      for (const origin of parentOrigins) expect(origin.startsWith('http')).toBe(true);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('ignores stale commit sequences', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      const first = await commitScormAttempt(token, { commitSequence: 1, cmi: { suspend_data: 'a'.repeat(5120) } });
      expect(first.saved).toBe(true);

      const stale = await commitScormAttempt(token, { commitSequence: 1, cmi: { suspend_data: 'b' } });
      expect(stale.saved).toBe(false);

      const state = await getScormRuntimeState(token);
      expect(state.cmi).toMatchObject({ suspend_data: 'a'.repeat(5120) });
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('completes on a passing commit, writes completion and claims the certificate', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      certificate: { threshold: 100, requiredExerciseId: null, isDownloadable: false },
      withPlan: true
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-2' }, context);
      if (!first.available) throw new Error('launch unavailable');
      expect(first.unit.identifier).toBe('mod-2');

      const partial = await commitScormAttempt(launchTokenOf(first.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });
      expect(partial.saved).toBe(true);
      expect(partial.completedActivity).toBe(false);

      const second = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-1' }, context);
      if (!second.available) throw new Error('launch unavailable');

      const result = await commitScormAttempt(launchTokenOf(second.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });

      expect(result.saved).toBe(true);
      expect(result.completedActivity).toBe(true);

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const [completion] = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, fixture.activityId));
      expect(completion?.isComplete).toBe(true);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).not.toBeNull();
      expect(attempts[0]?.closeReason).toBe('finished');

      const members = await db
        .select()
        .from(schema.groupmember)
        .where(eq(schema.groupmember.profileId, fixture.studentId));
      expect(members[0]?.certificateEarnedAt).not.toBeNull();
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('marks the compliance record compliant with minutes from session times', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html' }],
      courseType: 'COMPLIANCE',
      certificate: { deadline: '2027-12-31T23:59:00.000Z', requiredExerciseId: null, isDownloadable: false },
      compliance: { retakeIntervalMonths: 12 }
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { updateScoAttempt } = await import('@cio/db/queries/scorm/sco-attempt');
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      const startedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const tries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempts[0]!.id));
      for (const row of tries) await updateScoAttempt(row.id, { startedAt });

      const result = await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });
      expect(result.completedActivity).toBe(true);

      const records = await db
        .select()
        .from(schema.courseCompletionRecord)
        .where(eq(schema.courseCompletionRecord.profileId, fixture.studentId));
      expect(records[0]?.status).toBe('compliant');
      expect(Number(records[0]?.timeSpentMinutes ?? 0)).toBeGreaterThanOrEqual(5);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('takes the compliance score, attempts and minutes from the package in a SCORM course', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html', masteryScoreRaw: 70 }],
      courseType: 'COMPLIANCE',
      courseFormat: 'single_activity',
      certificate: { deadline: '2027-12-31T23:59:00.000Z', requiredExerciseId: null, isDownloadable: false },
      compliance: { retakeIntervalMonths: 12 }
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { updateScoAttempt } = await import('@cio/db/queries/scorm/sco-attempt');
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      const startedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const tries = await db
        .select()
        .from(schema.scormScoAttempt)
        .where(eq(schema.scormScoAttempt.attemptId, attempts[0]!.id));
      for (const row of tries) await updateScoAttempt(row.id, { startedAt });

      const result = await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: {
          'core.lesson_status': 'passed',
          'core.score.raw': '85',
          'core.score.min': '0',
          'core.score.max': '100'
        },
        terminate: true
      });
      expect(result.completedActivity).toBe(true);

      const records = await db
        .select()
        .from(schema.courseCompletionRecord)
        .where(eq(schema.courseCompletionRecord.profileId, fixture.studentId));
      expect(records[0]?.status).toBe('compliant');
      expect(records[0]?.score).toBe(85);
      expect(records[0]?.attempts).toBe(1);
      expect(Number(records[0]?.timeSpentMinutes ?? 0)).toBeGreaterThanOrEqual(5);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('stores package minutes on the compliance record when no minutes are supplied', { timeout: 30000 }, async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html', masteryScoreRaw: 70 }],
      courseType: 'COMPLIANCE',
      courseFormat: 'single_activity',
      certificate: { deadline: '2027-12-31T23:59:00.000Z', requiredExerciseId: null, isDownloadable: false },
      compliance: { retakeIntervalMonths: 12 }
    });
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { syncComplianceProgressForMember } = await import('@api/services/course/compliance');

      const base = Date.parse('2026-01-01T00:00:00.000Z');
      const iso = (offsetMs: number) => new Date(base + offsetMs).toISOString();
      await db.insert(schema.activityCompletion).values({
        activityId: fixture.activityId,
        profileId: fixture.studentId,
        isComplete: true,
        completedAt: iso(400_000)
      });
      const [attempt] = await db
        .insert(schema.scormAttempt)
        .values({
          activityId: fixture.activityId,
          profileId: fixture.studentId,
          packageVersionId: fixture.versionId,
          attemptNumber: 1,
          startedAt: iso(0),
          closedAt: iso(400_000),
          closeReason: 'finished'
        })
        .returning();
      await db.insert(schema.scormScoAttempt).values({
        attemptId: attempt!.id,
        unitId: fixture.unitIds['mod-1']!,
        status: 'closed',
        cmi: { core: { lesson_status: 'passed', score: { raw: '85', min: '0', max: '100' } } },
        commitSeq: 1,
        startedAt: iso(0),
        lastCommitAt: iso(360_000),
        terminatedAt: iso(360_000)
      });

      const result = await syncComplianceProgressForMember(fixture.courseId, fixture.studentId, 'activity');

      expect(result).toMatchObject({ status: 'compliant', completed: true });

      const [record] = await db
        .select()
        .from(schema.courseCompletionRecord)
        .where(eq(schema.courseCompletionRecord.profileId, fixture.studentId));
      expect(record?.score).toBe(85);
      expect(record?.attempts).toBe(1);
      expect(record?.timeSpentMinutes).toBe(6);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('completes a three-module 2004 package in any order only after the last module', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm2004_4',
      units: [
        { identifier: 'm-1', title: 'One', href: 'm1.html' },
        { identifier: 'm-2', title: 'Two', href: 'm2.html' },
        { identifier: 'm-3', title: 'Three', href: 'm3.html' }
      ]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const completeModule = async (identifier: string) => {
        const launched = await launchActivity(
          fixture.courseId,
          fixture.activityId,
          { unitIdentifier: identifier },
          context
        );
        if (!launched.available) throw new Error('launch unavailable');

        return commitScormAttempt(launchTokenOf(launched.playerUrl), {
          commitSequence: 1,
          cmi: { completion_status: 'completed', success_status: 'unknown', exit: 'normal' },
          terminate: true
        });
      };

      expect((await completeModule('m-3')).completedActivity).toBe(false);
      expect((await completeModule('m-1')).completedActivity).toBe(false);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.closedAt).toBeNull();

      expect((await completeModule('m-2')).completedActivity).toBe(true);

      const reopened = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      expect(reopened.available).toBe(true);
      if (!reopened.available) throw new Error('launch unavailable');
      expect(reopened.mode).toBe('review');
      const state = await getScormRuntimeState(launchTokenOf(reopened.playerUrl));
      expect(state.format).toBe('scorm2004');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('starts a failed 1.2 module fresh while the attempt stays open', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [{ identifier: 'quiz', title: 'Quiz', href: 'quiz.html', masteryScoreRaw: 80 }]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const failed = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!failed.available) throw new Error('launch unavailable');

      const failResult = await commitScormAttempt(launchTokenOf(failed.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.score.raw': '50' },
        terminate: true
      });
      expect(failResult.saved).toBe(true);
      expect(failResult.completedActivity).toBe(false);

      const relaunched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!relaunched.available) throw new Error('launch unavailable');
      const state = await getScormRuntimeState(launchTokenOf(relaunched.playerUrl));
      expect(state.cmi).toEqual({});
      expect(state.entry).toBe('ab-initio');

      const passResult = await commitScormAttempt(launchTokenOf(relaunched.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.score.raw': '90' },
        terminate: true
      });
      expect(passResult.completedActivity).toBe(true);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('resumes a 1.2 unfinished exit but starts a 2004 normal exit fresh', async () => {
    const fixture12 = await createRuntimeFixture(suffix());
    const fixture04 = await createRuntimeFixture(suffix(), { format: 'scorm2004_4' });
    try {
      const context12 = { profileId: fixture12.studentId, organizationId: fixture12.orgId, isPreview: false };
      const launched12 = await launchActivity(fixture12.courseId, fixture12.activityId, {}, context12);
      if (!launched12.available) throw new Error('launch unavailable');
      await commitScormAttempt(launchTokenOf(launched12.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'incomplete' },
        terminate: true
      });
      const relaunched12 = await launchActivity(fixture12.courseId, fixture12.activityId, {}, context12);
      if (!relaunched12.available) throw new Error('launch unavailable');
      const state12 = await getScormRuntimeState(launchTokenOf(relaunched12.playerUrl));
      expect(state12.entry).toBe('resume');

      const context04 = { profileId: fixture04.studentId, organizationId: fixture04.orgId, isPreview: false };
      const launched04 = await launchActivity(fixture04.courseId, fixture04.activityId, {}, context04);
      if (!launched04.available) throw new Error('launch unavailable');
      await commitScormAttempt(launchTokenOf(launched04.playerUrl), {
        commitSequence: 1,
        cmi: { completion_status: 'incomplete', exit: 'normal' },
        terminate: true
      });
      const relaunched04 = await launchActivity(fixture04.courseId, fixture04.activityId, {}, context04);
      if (!relaunched04.available) throw new Error('launch unavailable');
      const state04 = await getScormRuntimeState(launchTokenOf(relaunched04.playerUrl));
      expect(state04.entry).toBe('ab-initio');
      expect(state04.cmi).toEqual({});
    } finally {
      await cleanupRuntimeFixture(fixture12);
      await cleanupRuntimeFixture(fixture04);
    }
  });

  it('refuses new attempts with retakes off and opens attempt 2 with retakes on', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html' }]
    });
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!first.available) throw new Error('launch unavailable');
      await commitScormAttempt(launchTokenOf(first.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });

      const review = await launchActivity(fixture.courseId, fixture.activityId, { newAttempt: true }, context);
      expect(review.available).toBe(true);
      if (!review.available) throw new Error('launch unavailable');
      expect(review.mode).toBe('review');
      expect(await listAttempts(fixture.activityId, fixture.studentId)).toHaveLength(1);

      await db
        .update(schema.activityScorm)
        .set({ allowRetakes: true })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      const retake = await launchActivity(fixture.courseId, fixture.activityId, { newAttempt: true }, context);
      if (!retake.available) throw new Error('launch unavailable');
      expect(retake.mode).toBe('normal');
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(2);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('moves everyone to the new version and launches it', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!first.available) throw new Error('launch unavailable');

      const [version2] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: fixture.assetId,
          versionNumber: 2,
          status: 'ready',
          format: 'scorm12',
          uploadKey: 'scorm/rt/v2.zip',
          contentPrefix: 'scorm/rt/v2'
        })
        .returning();
      for (const [index, identifier] of ['mod-1', 'mod-2'].entries()) {
        await db.insert(schema.contentPackageUnit).values({
          packageVersionId: version2!.id,
          identifier,
          title: `Module ${identifier}`,
          position: index,
          unitType: 'sco',
          href: `${identifier}.html`
        });
      }

      const made = await makeScormPackageVersionCurrent(fixture.orgId, fixture.assetId, version2!.id, {
        closeOpenAttempts: true
      });
      expect(made.closedAttempts).toBe(1);

      const second = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!second.available) throw new Error('launch unavailable');
      expect(second.mode).toBe('normal');
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(2);
      expect(attempts[1]?.packageVersionId).toBe(version2!.id);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('gives team previews that open nothing and save nothing', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const preview = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        {},
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: true }
      );

      expect(preview.available).toBe(true);
      if (!preview.available) throw new Error('launch unavailable');
      expect(preview.mode).toBe('preview');
      expect(await listAttempts(fixture.activityId, fixture.studentId)).toHaveLength(0);

      const token = launchTokenOf(preview.playerUrl);
      const state = await getScormRuntimeState(token);
      expect(state.cmi).toEqual({});

      const result = await commitScormAttempt(token, { commitSequence: 1, cmi: { suspend_data: 'x' } });
      expect(result.saved).toBe(false);
      expect(await listAttempts(fixture.activityId, fixture.studentId)).toHaveLength(0);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('returns unavailable without a package and 404 for unknown modules', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db
        .update(schema.activityScorm)
        .set({ assetId: null })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));

      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const empty = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      expect(empty.available).toBe(false);

      await db
        .update(schema.activityScorm)
        .set({ assetId: fixture.assetId })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      try {
        await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'nope' }, context);
        expect.unreachable('unknown modules must throw');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
      }

      try {
        await launchActivity(fixture.courseId, '00000000-0000-0000-0000-000000000000', {}, context);
        expect.unreachable('foreign activities must throw');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
      }
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });
});
