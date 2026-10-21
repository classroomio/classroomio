import 'dotenv/config';

import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return { ...original, getActivitySigningSecret: () => 'test-activity-signing-secret-0123456789' };
});

import { getActivityProgress, launchActivity } from '@cio/core/services/activity/activity';
import { makeScormPackageVersionCurrent } from '@cio/core/services/activity/packages';
import { attachScormPackage } from '@cio/core/services/activity/providers';
import { createCoursesFromPackages } from '@cio/core/services/activity/courses';
import { commitScormAttempt, getScormRuntimeState } from '@api/services/activity/runtime-scorm';
import { ZScormCommit, ZScormSettings } from '@cio/utils/validation/activity/scorm';
import { AppError } from '@api/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type UnitDef = {
  identifier: string;
  title: string;
  href: string;
  isVisible?: boolean;
  masteryScoreRaw?: number | null;
  passingScoreScaled?: number | null;
  completionThreshold?: number | null;
  formatDetails?:
    | { format: 'scorm2004'; maxTimeAllowed: string | null; timeLimitAction: string | null }
    | { format: 'scorm12'; maxTimeAllowed?: string | null; timeLimitAction?: string | null };
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
  moduleOrder?: 'free' | 'sequential';
  completionModules?: 'all' | 'graded_only';
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
    allowRetakes = false,
    moduleOrder = 'free',
    completionModules = 'all'
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
      description: 'run-time',
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
  await db
    .insert(schema.activityScorm)
    .values({ activityId: activity.id, assetId: asset.id, allowRetakes, moduleOrder, completionModules });
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
        isVisible: unit.isVisible ?? true,
        masteryScoreRaw: unit.masteryScoreRaw == null ? null : String(unit.masteryScoreRaw),
        passingScoreScaled: unit.passingScoreScaled == null ? null : String(unit.passingScoreScaled),
        completionThreshold: unit.completionThreshold == null ? null : String(unit.completionThreshold),
        ...(unit.formatDetails ? { formatDetails: unit.formatDetails } : {})
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

  it('defaults module order to free and accepts sequential', () => {
    expect(ZScormSettings.parse({}).moduleOrder).toBe('free');
    expect(ZScormSettings.parse({ moduleOrder: 'sequential' }).moduleOrder).toBe('sequential');
    expect(ZScormSettings.safeParse({ moduleOrder: 'random' }).success).toBe(false);
  });
});

describe.skipIf(!hasDatabase)('scorm launch and run-time', () => {
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

  it('saves commits numbered above the stored sequence after resume', async () => {
    const fixture = await createRuntimeFixture(suffix());
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
      const resumed = await getScormRuntimeState(launchTokenOf(second.playerUrl));
      expect(resumed.commitSeq).toBe(1);

      const saved = await commitScormAttempt(launchTokenOf(second.playerUrl), {
        commitSequence: resumed.commitSeq + 1,
        cmi: { 'core.lesson_location': 'page-5', suspend_data: 'bookmark=4' }
      });
      expect(saved.saved).toBe(true);

      const reread = await getScormRuntimeState(launchTokenOf(second.playerUrl));
      expect(reread.cmi).toMatchObject({ core: { lesson_location: 'page-5' } });
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

      const laterSave = await commitScormAttempt(launchTokenOf(second.playerUrl), {
        commitSequence: 2,
        cmi: { 'core.session_time': '00:03:00' }
      });
      expect(laterSave.saved).toBe(true);
      expect(laterSave.completedActivity).toBe(false);
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

      const result = await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed', 'core.session_time': '00:06:00' },
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

  it('does not complete a new compliance cycle from an attempt opened in the previous one', async () => {
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
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);

      const attemptStartedAt = new Date(Date.now() - 10 * 86_400_000).toISOString();
      await db
        .update(schema.scormAttempt)
        .set({ startedAt: attemptStartedAt })
        .where(eq(schema.scormAttempt.id, attempts[0]!.id));
      const [member] = await db
        .select()
        .from(schema.groupmember)
        .where(eq(schema.groupmember.profileId, fixture.studentId));
      await db.insert(schema.courseCompletionRecord).values({
        courseId: fixture.courseId,
        groupMemberId: member!.id,
        profileId: fixture.studentId,
        cycleNumber: 2,
        status: 'in_progress',
        dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        createdAt: new Date(Date.now() - 86_400_000).toISOString()
      });

      const result = await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed', 'core.session_time': '00:06:00' },
        terminate: true
      });

      expect(result).toMatchObject({ saved: true, completedActivity: false });
      const completions = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.profileId, fixture.studentId));
      expect(completions).toHaveLength(0);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('reports a module tick mid-session without relaunching', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm2004_4',
      units: [
        { identifier: 'm-1', title: 'One', href: 'm1.html' },
        { identifier: 'm-2', title: 'Two', href: 'm2.html' }
      ]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'm-1' }, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      const before = await getActivityProgress(fixture.courseId, fixture.activityId, context);
      expect(before.units.map((unit) => unit.completed)).toEqual([false, false]);

      const ticked = await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { completion_status: 'completed', success_status: 'unknown' }
      });
      expect(ticked).toMatchObject({ saved: true, completedActivity: false, progressChanged: true });

      const repeated = await commitScormAttempt(token, {
        commitSequence: 2,
        cmi: { completion_status: 'completed', success_status: 'unknown', location: 'page-2' }
      });
      expect(repeated.progressChanged).toBe(false);

      const after = await getActivityProgress(fixture.courseId, fixture.activityId, context);
      expect(after.units.map((unit) => unit.completed)).toEqual([true, false]);
      expect(after.units[0]?.status).toBe('active');

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.closedAt).toBeNull();
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('completes a three-module 2004 package in any order only after the last module', { timeout: 30000 }, async () => {
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

  it('starts a failed 1.2 module fresh while the attempt stays open', { timeout: 30000 }, async () => {
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
      expect(state.cmi).toMatchObject({
        core: { student_id: fixture.studentId },
        student_data: { mastery_score: '80' }
      });
      expect((state.cmi['core'] as Record<string, unknown>)['score']).toBeUndefined();
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

  it('resumes a 1.2 unfinished exit but starts a 2004 normal exit fresh', { timeout: 30000 }, async () => {
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
      expect(state04.cmi).toMatchObject({ learner_id: fixture04.studentId });
      expect(state04.cmi).not.toMatchObject({ completion_status: 'incomplete' });
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

  it('keeps an open attempt on its pinned version after a replace that does not move everyone', async () => {
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
          href: `${identifier}-v2.html`
        });
      }
      await makeScormPackageVersionCurrent(fixture.orgId, fixture.assetId, version2!.id, {
        closeOpenAttempts: false
      });

      const second = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!second.available) throw new Error('launch unavailable');
      const state = await getScormRuntimeState(launchTokenOf(second.playerUrl));
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);

      expect(second.unit.href).toBe('mod1.html');
      expect(state.launchPath).toBe('mod1.html');
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.packageVersionId).toBe(fixture.versionId);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('starts a new attempt on the new package when the activity switches packages', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!first.available) throw new Error('launch unavailable');

      const [otherAsset] = await db
        .insert(schema.asset)
        .values({ organizationId: fixture.orgId, kind: 'scorm', title: 'Other package zip' })
        .returning();
      const [otherVersion] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: otherAsset!.id,
          versionNumber: 1,
          status: 'ready',
          isCurrent: true,
          format: 'scorm12',
          uploadKey: 'scorm/rt-other/v1.zip',
          contentPrefix: 'scorm/rt-other/v1'
        })
        .returning();
      await db.insert(schema.contentPackageUnit).values({
        packageVersionId: otherVersion!.id,
        identifier: 'other-1',
        title: 'Other module',
        position: 0,
        unitType: 'sco',
        href: 'other.html'
      });
      await db
        .update(schema.activityScorm)
        .set({ assetId: otherAsset!.id })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));

      const second = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!second.available) throw new Error('launch unavailable');
      const state = await getScormRuntimeState(launchTokenOf(second.playerUrl));
      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      const byNumber = [...attempts].sort((left, right) => left.attemptNumber - right.attemptNumber);

      expect(second.mode).toBe('normal');
      expect(state.launchPath).toBe('other.html');
      expect(byNumber).toHaveLength(2);
      expect(byNumber[0]?.closeReason).toBe('replaced');
      expect(byNumber[1]?.packageVersionId).toBe(otherVersion!.id);
      expect(byNumber[1]?.closedAt).toBeNull();

      const lateCommit = await commitScormAttempt(launchTokenOf(first.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_location': 'slide-2' }
      });
      expect(lateCommit.saved).toBe(true);

      const passingCommit = await commitScormAttempt(launchTokenOf(first.playerUrl), {
        commitSequence: 2,
        cmi: { 'core.completion_status': 'completed', 'core.success_status': 'passed' },
        terminate: true
      });
      expect(passingCommit.saved).toBe(true);
      expect(passingCommit.completedActivity).toBe(false);

      const [completion] = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, fixture.activityId));
      expect(completion?.isComplete).not.toBe(true);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('treats re-attaching the attached package as a no-op', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const first = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!first.available) throw new Error('launch unavailable');

      await attachScormPackage(fixture.activityId, fixture.assetId, fixture.orgId, fixture.studentId);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.closedAt).toBeNull();
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('refuses to swap in a package identical to the attached one', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const sha = 'a'.repeat(64);
      await db
        .update(schema.contentPackageVersion)
        .set({ contentSha256: sha })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));

      const createOtherPackage = async (contentSha256: string) => {
        const [otherAsset] = await db
          .insert(schema.asset)
          .values({ organizationId: fixture.orgId, kind: 'scorm', title: 'Other package zip' })
          .returning();
        const [otherVersion] = await db
          .insert(schema.contentPackageVersion)
          .values({
            assetId: otherAsset!.id,
            versionNumber: 1,
            status: 'ready',
            isCurrent: true,
            format: 'scorm12',
            uploadKey: `scorm/${otherAsset!.id}/v1.zip`,
            contentPrefix: `scorm/${otherAsset!.id}/v1`,
            contentSha256
          })
          .returning();

        return { assetId: otherAsset!.id, versionId: otherVersion!.id };
      };

      const identical = await createOtherPackage(sha);
      await expect(
        attachScormPackage(fixture.activityId, identical.assetId, fixture.orgId, fixture.studentId)
      ).rejects.toMatchObject({ statusCode: 409 });

      const [unchanged] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      expect(unchanged?.assetId).toBe(fixture.assetId);

      const different = await createOtherPackage('b'.repeat(64));
      await attachScormPackage(fixture.activityId, different.assetId, fixture.orgId, fixture.studentId);

      const [swapped] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      expect(swapped?.assetId).toBe(different.assetId);
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
      expect(state.cmi).toMatchObject({ core: { student_id: fixture.studentId } });

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

  it('leaves every module unlocked when order is free', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      expect(launched.units.map((unit) => unit.locked)).toEqual([false, false]);

      const direct = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-2' }, context);
      if (!direct.available) throw new Error('launch unavailable');
      expect(direct.unit.identifier).toBe('mod-2');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('locks later modules until earlier ones complete when order is sequential', async () => {
    const fixture = await createRuntimeFixture(suffix(), { moduleOrder: 'sequential' });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      expect(launched.unit.identifier).toBe('mod-1');
      expect(launched.units.map((unit) => unit.locked)).toEqual([false, true]);

      try {
        await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-2' }, context);
        expect.unreachable('locked modules must throw');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(403);
      }

      const completed = await commitScormAttempt(launchTokenOf(launched.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });
      expect(completed.saved).toBe(true);

      const reopened = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!reopened.available) throw new Error('launch unavailable');
      expect(reopened.units.map((unit) => unit.locked)).toEqual([false, false]);
      expect(reopened.unit.identifier).toBe('mod-2');

      const direct = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-2' }, context);
      if (!direct.available) throw new Error('launch unavailable');
      expect(direct.unit.identifier).toBe('mod-2');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('hides invisible modules from the menu and refuses to launch them', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      units: [
        { identifier: 'mod-1', title: 'Module one', href: 'mod1.html' },
        { identifier: 'hidden', title: 'Hidden helper', href: 'hidden.html', isVisible: false },
        { identifier: 'mod-2', title: 'Module two', href: 'mod2.html' }
      ]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      expect(launched.units.map((unit) => unit.identifier)).toEqual(['mod-1', 'mod-2']);

      try {
        await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'hidden' }, context);
        expect.unreachable('hidden modules must throw');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
      }
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('hands the package the learner identity and the unit pass mark', async () => {
    const sfx = suffix();
    const fixture = await createRuntimeFixture(sfx, {
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html', masteryScoreRaw: 80 }]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      const state = await getScormRuntimeState(launchTokenOf(launched.playerUrl));
      expect(state.cmi).toMatchObject({
        core: { student_id: fixture.studentId, student_name: `${sfx}, Rt` },
        student_data: { mastery_score: '80' }
      });
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('hands 2004 packages the learner identity and the scaled pass mark', async () => {
    const sfx = suffix();
    const fixture = await createRuntimeFixture(sfx, {
      format: 'scorm2004_4',
      units: [{ identifier: 'mod-1', title: 'Module one', href: 'mod1.html', passingScoreScaled: 0.8 }]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      const state = await getScormRuntimeState(launchTokenOf(launched.playerUrl));
      expect(state.cmi).toMatchObject({
        learner_id: fixture.studentId,
        learner_name: `${sfx}, Rt`,
        scaled_passing_score: '0.8'
      });
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('defaults sequential order for sequenced packages on first attach', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db
        .update(schema.contentPackageVersion)
        .set({ warnings: ['has_sequencing'] })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));
      await db
        .update(schema.activityScorm)
        .set({ assetId: null })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));

      await attachScormPackage(fixture.activityId, fixture.assetId, fixture.orgId, fixture.studentId);

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      expect(details?.assetId).toBe(fixture.assetId);
      expect(details?.moduleOrder).toBe('sequential');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('defaults free order for packages without sequencing rules on first attach', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db
        .update(schema.activityScorm)
        .set({ assetId: null })
        .where(eq(schema.activityScorm.activityId, fixture.activityId));

      await attachScormPackage(fixture.activityId, fixture.assetId, fixture.orgId, fixture.studentId);

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      expect(details?.moduleOrder).toBe('free');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('re-derives the order when swapping packages', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const [otherAsset] = await db
        .insert(schema.asset)
        .values({ organizationId: fixture.orgId, kind: 'scorm', title: 'Other package zip' })
        .returning();
      const [otherVersion] = await db
        .insert(schema.contentPackageVersion)
        .values({
          assetId: otherAsset!.id,
          versionNumber: 1,
          status: 'ready',
          isCurrent: true,
          format: 'scorm12',
          uploadKey: `scorm/${otherAsset!.id}/v1.zip`,
          contentPrefix: `scorm/${otherAsset!.id}/v1`,
          warnings: ['has_sequencing']
        })
        .returning();
      if (!otherVersion) throw new Error('missing version');

      await attachScormPackage(fixture.activityId, otherAsset!.id, fixture.orgId, fixture.studentId);

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, fixture.activityId));
      expect(details?.assetId).toBe(otherAsset!.id);
      expect(details?.moduleOrder).toBe('sequential');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('defaults the order from package warnings when creating courses from packages', async () => {
    const fixture = await createRuntimeFixture(suffix());
    let createdCourseId: string | null = null;
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      await db
        .update(schema.contentPackageVersion)
        .set({ warnings: ['has_sequencing'] })
        .where(eq(schema.contentPackageVersion.id, fixture.versionId));

      const created = await createCoursesFromPackages(fixture.orgId, fixture.studentId, {
        assetIds: [fixture.assetId],
        courseType: 'SELF_PACED',
        titles: { [fixture.assetId]: 'Sequenced course' }
      });
      createdCourseId = created[0]?.id ?? null;
      const createdActivityId = created[0]?.activityId ?? null;
      if (!createdCourseId || !createdActivityId) throw new Error('course was not created');

      const [details] = await db
        .select()
        .from(schema.activityScorm)
        .where(eq(schema.activityScorm.activityId, createdActivityId));
      expect(details?.moduleOrder).toBe('sequential');
    } finally {
      if (createdCourseId) {
        const { db } = await import('@db/drizzle');
        const schema = await import('@db/schema');
        await db.delete(schema.courseNewsfeed).where(eq(schema.courseNewsfeed.courseId, createdCourseId));
        await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, createdCourseId));
        await db.delete(schema.course).where(eq(schema.course.id, createdCourseId));
      }
      await cleanupRuntimeFixture(fixture);
    }
  });
});

describe.skipIf(!hasDatabase)('scorm time tracking and limits (phase 4 step 3)', () => {
  async function tryOf(activityId: string, profileId: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const attempts = await listAttempts(activityId, profileId);
    const [row] = await db
      .select()
      .from(schema.scormScoAttempt)
      .where(eq(schema.scormScoAttempt.attemptId, attempts[0]!.id));

    return row;
  }

  it('persists package-reported session time and accumulates heartbeats', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      const starting = await getScormRuntimeState(token);
      expect(starting.cmi['max_time_allowed']).toBeUndefined();

      await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { 'core.session_time': '00:05:00' }
      });
      expect((await tryOf(fixture.activityId, fixture.studentId))?.timeSpentSeconds).toBe(300);

      const second = await commitScormAttempt(token, { commitSequence: 2, cmi: {} });
      expect(second.saved).toBe(true);
      const tracked = (await tryOf(fixture.activityId, fixture.studentId))?.timeSpentSeconds ?? 0;
      expect(tracked).toBeGreaterThanOrEqual(300);
      expect(tracked).toBeLessThan(360);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('caps dormant gaps at one heartbeat instead of wall-clock time', async () => {
    const fixture = await createRuntimeFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');
      const token = launchTokenOf(launched.playerUrl);

      await commitScormAttempt(token, {
        commitSequence: 1,
        cmi: { 'core.session_time': '00:05:00' }
      });

      const dormantSince = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const stored = await tryOf(fixture.activityId, fixture.studentId);
      await db
        .update(schema.scormScoAttempt)
        .set({ lastCommitAt: dormantSince })
        .where(eq(schema.scormScoAttempt.id, stored!.id));

      await commitScormAttempt(token, { commitSequence: 2, cmi: {} });
      expect((await tryOf(fixture.activityId, fixture.studentId))?.timeSpentSeconds).toBe(360);
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('initializes 2004 launch CMI with manifest time limits', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm2004_4',
      units: [
        {
          identifier: 'mod-1',
          title: 'Module one',
          href: 'mod1.html',
          formatDetails: { format: 'scorm2004', maxTimeAllowed: 'PT45M', timeLimitAction: 'continue,no message' }
        }
      ]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      const state = await getScormRuntimeState(launchTokenOf(launched.playerUrl));
      expect(state.cmi['max_time_allowed']).toBe('PT45M');
      expect(state.cmi['time_limit_action']).toBe('continue,no message');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('initializes 1.2 launch CMI with manifest time limits in student_data', async () => {
    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm12',
      units: [
        {
          identifier: 'mod-1',
          title: 'Module one',
          href: 'mod1.html',
          formatDetails: { format: 'scorm12', maxTimeAllowed: '00:45:00', timeLimitAction: 'exit,message' }
        }
      ]
    });
    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launched = await launchActivity(fixture.courseId, fixture.activityId, {}, context);
      if (!launched.available) throw new Error('launch unavailable');

      const state = await getScormRuntimeState(launchTokenOf(launched.playerUrl));
      const studentData = state.cmi['student_data'] as Record<string, unknown>;
      expect(studentData).toBeDefined();
      expect(studentData['max_time_allowed']).toBe('00:45:00');
      expect(studentData['time_limit_action']).toBe('exit,message');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('completes on graded modules only when completion scope is graded_only', async () => {
    const units = [
      { identifier: 'mod-1', title: 'Intro', href: 'mod1.html' },
      { identifier: 'mod-2', title: 'Quiz', href: 'mod2.html', masteryScoreRaw: 80 },
      { identifier: 'mod-3', title: 'Survey', href: 'mod3.html' }
    ];
    const scoped = await createRuntimeFixture(suffix(), { units, completionModules: 'graded_only' });
    const unscoped = await createRuntimeFixture(suffix(), { units });
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      for (const fixture of [scoped, unscoped]) {
        const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
        const intro = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-1' }, context);
        if (!intro.available) throw new Error('launch unavailable');
        await commitScormAttempt(launchTokenOf(intro.playerUrl), {
          commitSequence: 1,
          cmi: { 'core.lesson_status': 'completed' },
          terminate: true
        });

        const quiz = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'mod-2' }, context);
        if (!quiz.available) throw new Error('launch unavailable');
        const finished = await commitScormAttempt(launchTokenOf(quiz.playerUrl), {
          commitSequence: 1,
          cmi: { 'core.score.raw': '90' },
          terminate: true
        });

        const [completion] = await db
          .select()
          .from(schema.activityCompletion)
          .where(eq(schema.activityCompletion.activityId, fixture.activityId));

        if (fixture === scoped) {
          expect(finished.completedActivity).toBe(true);
          expect(completion?.isComplete).toBe(true);
        } else {
          expect(finished.completedActivity).toBe(false);
          expect(completion?.isComplete).not.toBe(true);
        }
      }
    } finally {
      await cleanupRuntimeFixture(scoped);
      await cleanupRuntimeFixture(unscoped);
    }
  });

  it('populates cmi.completion_threshold on 2004 launch state', async () => {
    if (!hasDatabase) return;

    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm2004_4',
      units: [
        {
          identifier: 'unit-thresh',
          title: 'Threshold Unit',
          href: 'index.html',
          completionThreshold: 0.85
        }
      ]
    });

    try {
      const launch = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        { unitIdentifier: 'unit-thresh' },
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );
      if (!launch.available) throw new Error('Launch not available');

      const state = await getScormRuntimeState(launchTokenOf(launch.playerUrl));
      expect(state.cmi['completion_threshold']).toBe('0.85');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('keeps attempt open on mid-session commit when rule is met', async () => {
    if (!hasDatabase) return;

    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm12',
      units: [{ identifier: 'mod-1', title: 'Single Module', href: 'mod1.html' }]
    });

    try {
      const launch = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        { unitIdentifier: 'mod-1' },
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );
      if (!launch.available) throw new Error('Launch not available');

      const result = await commitScormAttempt(launchTokenOf(launch.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: false
      });

      expect(result.saved).toBe(true);
      expect(result.completedActivity).toBe(true);

      const attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).toBeNull();
      expect(attempts[0]?.closeReason).toBeNull();
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('keeps multi-SCO attempt open until all launchable SCOs terminate', async () => {
    if (!hasDatabase) return;

    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm12',
      units: [
        { identifier: 'sco-1', title: 'First SCO', href: 'sco1.html' },
        { identifier: 'sco-2', title: 'Second SCO', href: 'sco2.html' }
      ]
    });

    try {
      const context = { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false };
      const launch1 = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'sco-1' }, context);
      if (!launch1.available) throw new Error('Launch not available');

      await commitScormAttempt(launchTokenOf(launch1.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });

      let attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).toBeNull();

      const launch2 = await launchActivity(fixture.courseId, fixture.activityId, { unitIdentifier: 'sco-2' }, context);
      if (!launch2.available) throw new Error('Launch not available');

      await commitScormAttempt(launchTokenOf(launch2.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'completed' },
        terminate: true
      });

      attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).not.toBeNull();
      expect(attempts[0]?.closeReason).toBe('finished');
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });

  it('reopens attempt when settings change causes completion to be cleared', async () => {
    if (!hasDatabase) return;

    const fixture = await createRuntimeFixture(suffix(), {
      format: 'scorm12',
      units: [{ identifier: 'quiz-1', title: 'Quiz', href: 'quiz.html' }]
    });

    try {
      const { updateActivitySettings } = await import('@cio/core/services/activity/activity');
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');

      const launch = await launchActivity(
        fixture.courseId,
        fixture.activityId,
        { unitIdentifier: 'quiz-1' },
        { profileId: fixture.studentId, organizationId: fixture.orgId, isPreview: false }
      );
      if (!launch.available) throw new Error('Launch not available');

      await commitScormAttempt(launchTokenOf(launch.playerUrl), {
        commitSequence: 1,
        cmi: { 'core.lesson_status': 'passed', 'core.score.raw': '75' },
        terminate: true
      });

      let [completion] = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, fixture.activityId));
      expect(completion?.isComplete).toBe(true);

      let attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).not.toBeNull();
      expect(attempts[0]?.closeReason).toBe('finished');

      await updateActivitySettings(fixture.courseId, fixture.activityId, {
        completionRule: 'score',
        minScorePercent: 90,
        allowRetakes: false,
        moduleOrder: 'free',
        completionModules: 'all'
      });

      [completion] = await db
        .select()
        .from(schema.activityCompletion)
        .where(eq(schema.activityCompletion.activityId, fixture.activityId));
      expect(completion?.isComplete).toBe(false);

      attempts = await listAttempts(fixture.activityId, fixture.studentId);
      expect(attempts[0]?.closedAt).toBeNull();
      expect(attempts[0]?.closeReason).toBeNull();
    } finally {
      await cleanupRuntimeFixture(fixture);
    }
  });
});
