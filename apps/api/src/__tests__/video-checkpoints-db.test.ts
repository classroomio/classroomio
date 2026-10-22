import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const ASSET_ID = '7b1f6a52-3c1e-4a0b-9c55-0d2f6c7e8a11';
const OTHER_ASSET_ID = '9c2e7b63-4d2f-4b1c-8d66-1e3a7d8f9b22';

function radioCheckpoint(overrides: Record<string, unknown> = {}) {
  return {
    assetId: ASSET_ID,
    timestampSeconds: 10,
    questionType: 'RADIO' as const,
    title: 'Which option is right?',
    settings: {},
    resumePolicy: 'any' as const,
    options: [
      { label: 'Right', isCorrect: true },
      { label: 'Wrong', isCorrect: false }
    ],
    ...overrides
  };
}

describe.skipIf(!hasDatabase)('lesson video checkpoints against the database', () => {
  const suffix = Date.now();

  let organizationId = '';
  let courseId = '';
  let lessonId = '';
  let manualLessonId = '';
  let studentId = '';
  let freeOrganizationId = '';
  let freeLessonId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `checkpoints-${suffix}` });
    organizationId = organization.id;
    await db
      .insert(schema.organizationPlan)
      .values({ orgId: organizationId, planName: 'EARLY_ADOPTER', isActive: true });

    const [groupRow] = await db
      .insert(schema.group)
      .values({ name: `checkpoints-${suffix}`, organizationId })
      .returning();
    const [courseRow] = await db
      .insert(schema.course)
      .values({
        title: 'Checkpoint fixture',
        description: 'fixture',
        groupId: groupRow.id,
        slug: `checkpoints-${suffix}`
      })
      .returning();
    courseId = courseRow.id;

    const videos = [{ type: 'upload' as const, link: '/hls/test.m3u8', assetId: ASSET_ID, metadata: { duration: 60 } }];
    const [watchLesson] = await db
      .insert(schema.lesson)
      .values({
        courseId,
        title: 'Watch lesson',
        slug: `watch-${suffix}`,
        order: 1,
        videos,
        completionPolicy: 'video_watch'
      })
      .returning();
    lessonId = watchLesson.id;

    const [manualLesson] = await db
      .insert(schema.lesson)
      .values({
        courseId,
        title: 'Manual lesson',
        slug: `manual-${suffix}`,
        order: 2,
        videos,
        completionPolicy: 'manual'
      })
      .returning();
    manualLessonId = manualLesson.id;

    const email = `student-${suffix}@checkpoints.test`;
    const [userRow] = await db.insert(schema.user).values({ name: 'student', email, emailVerified: true }).returning();
    studentId = userRow.id;
    await db
      .insert(schema.profile)
      .values({ id: studentId, fullname: 'Casey Student', username: `casey-${suffix}`, email });

    const freeOrganization = await createOrganization({ name: `checkpoints-free-${suffix}` });
    freeOrganizationId = freeOrganization.id;
    const [freeGroup] = await db
      .insert(schema.group)
      .values({ name: `checkpoints-free-${suffix}`, organizationId: freeOrganizationId })
      .returning();
    const [freeCourse] = await db
      .insert(schema.course)
      .values({ title: 'Free fixture', description: 'fixture', groupId: freeGroup.id, slug: `free-${suffix}` })
      .returning();
    const [freeLesson] = await db
      .insert(schema.lesson)
      .values({ courseId: freeCourse.id, title: 'Free lesson', slug: `free-lesson-${suffix}`, order: 1, videos })
      .returning();
    freeLessonId = freeLesson.id;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (!studentId) return;

    await db.delete(schema.lessonCompletion).where(eq(schema.lessonCompletion.profileId, studentId));
    await db.delete(schema.lessonVideoProgress).where(eq(schema.lessonVideoProgress.profileId, studentId));
    await db.delete(schema.profile).where(eq(schema.profile.id, studentId));
    await db.delete(schema.user).where(eq(schema.user.id, studentId));
  });

  it('creates a checkpoint and returns the staff payload with the answer key', async () => {
    const { createVideoCheckpointService, listVideoCheckpointsForViewer } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const created = await createVideoCheckpointService(lessonId, radioCheckpoint());
    expect(created.question.options?.filter((option) => option.isCorrect)).toHaveLength(1);

    const staffView = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    expect(staffView.checkpoints).toHaveLength(1);
    expect(staffView.checkpoints[0].question.options?.some((option) => option.isCorrect)).toBe(true);
  });

  it('hides correct flags from learners', async () => {
    const { listVideoCheckpointsForViewer } = await import('@cio/core/services/lesson/video-checkpoint');

    const studentView = await listVideoCheckpointsForViewer(lessonId, studentId, false);
    expect(studentView.checkpoints[0].question.options?.every((option) => option.isCorrect === false)).toBe(true);
  });

  it('rejects a second question within two seconds on the same video', async () => {
    const { createVideoCheckpointService } = await import('@cio/core/services/lesson/video-checkpoint');

    await expect(
      createVideoCheckpointService(lessonId, radioCheckpoint({ timestampSeconds: 11 }))
    ).rejects.toMatchObject({
      statusCode: 409
    });
  });

  it('rejects a video that is not uploaded to the lesson and a time past the end', async () => {
    const { createVideoCheckpointService } = await import('@cio/core/services/lesson/video-checkpoint');

    await expect(
      createVideoCheckpointService(lessonId, radioCheckpoint({ assetId: OTHER_ASSET_ID, timestampSeconds: 30 }))
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      createVideoCheckpointService(lessonId, radioCheckpoint({ timestampSeconds: 60 }))
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('blocks authoring on a free-plan org', async () => {
    const { createVideoCheckpointService } = await import('@cio/core/services/lesson/video-checkpoint');

    await expect(createVideoCheckpointService(freeLessonId, radioCheckpoint())).rejects.toMatchObject({
      code: 'UPGRADE_REQUIRED',
      statusCode: 403
    });
  });

  it('scores an answer on the server and keeps the first answer for the any policy', async () => {
    const { answerVideoCheckpointService, listVideoCheckpointsForViewer } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const staffView = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    const checkpoint = staffView.checkpoints[0];
    const wrongOption = checkpoint.question.options!.find((option) => !option.isCorrect)!;
    const rightOption = checkpoint.question.options!.find((option) => option.isCorrect)!;

    const first = await answerVideoCheckpointService(lessonId, checkpoint.id, studentId, {
      type: 'RADIO',
      optionId: Number(wrongOption.id)
    });
    expect(first.isCorrect).toBe(false);
    expect(first.satisfied).toBe(true);

    const second = await answerVideoCheckpointService(lessonId, checkpoint.id, studentId, {
      type: 'RADIO',
      optionId: Number(rightOption.id)
    });
    expect(second.isCorrect).toBe(false);
  });

  it('requires the correct answer for the correct policy, then freezes it', async () => {
    const { createVideoCheckpointService, answerVideoCheckpointService, areLessonCheckpointsSatisfied } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const created = await createVideoCheckpointService(
      manualLessonId,
      radioCheckpoint({ timestampSeconds: 20, resumePolicy: 'correct' })
    );
    const wrongOption = created.question.options!.find((option) => !option.isCorrect)!;
    const rightOption = created.question.options!.find((option) => option.isCorrect)!;

    expect(await areLessonCheckpointsSatisfied(manualLessonId, studentId)).toBe(false);

    const wrong = await answerVideoCheckpointService(manualLessonId, created.id, studentId, {
      type: 'RADIO',
      optionId: Number(wrongOption.id)
    });
    expect(wrong).toMatchObject({ isCorrect: false, satisfied: false, lessonSatisfied: false });

    const right = await answerVideoCheckpointService(manualLessonId, created.id, studentId, {
      type: 'RADIO',
      optionId: Number(rightOption.id)
    });
    expect(right).toMatchObject({ isCorrect: true, satisfied: true, lessonSatisfied: true });

    const afterFreeze = await answerVideoCheckpointService(manualLessonId, created.id, studentId, {
      type: 'RADIO',
      optionId: Number(wrongOption.id)
    });
    expect(afterFreeze.isCorrect).toBe(true);
  });

  it('refuses manual completion until every checkpoint is satisfied', async () => {
    const { createVideoCheckpointService } = await import('@cio/core/services/lesson/video-checkpoint');
    const { upsertLessonCompletionService } = await import('@cio/core/services/lesson/lesson');

    const created = await createVideoCheckpointService(
      manualLessonId,
      radioCheckpoint({ timestampSeconds: 40, resumePolicy: 'any' })
    );
    expect(created.id).toBeTruthy();

    await expect(upsertLessonCompletionService(manualLessonId, studentId, true)).rejects.toMatchObject({
      code: 'VIDEO_CHECKPOINTS_INCOMPLETE'
    });
  });

  it('aggregates results and exports a CSV with spreadsheet formulas neutralised', async () => {
    const { getVideoCheckpointResultsService, buildVideoCheckpointResultsCsv } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const results = await getVideoCheckpointResultsService(lessonId);
    expect(results.checkpoints).toHaveLength(1);
    expect(results.checkpoints[0]).toMatchObject({ answeredCount: 1, correctCount: 0, correctPercent: 0 });
    expect(results.checkpoints[0].commonWrongAnswer?.label).toBe('Wrong');
    expect(results.learnersAnsweredAll).toBe(1);

    const csv = buildVideoCheckpointResultsCsv({
      ...results,
      answers: results.answers.map((answer) => ({ ...answer, fullname: '=HYPERLINK("x")' }))
    });
    expect(csv.split('\n')[1].startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true);
  });

  it('keeps answers when only the time changes', async () => {
    const { updateVideoCheckpointService, listVideoCheckpointsForViewer } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const before = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    const checkpoint = before.checkpoints[0];
    expect(before.answeredCheckpointIds).toContain(checkpoint.id);

    await updateVideoCheckpointService(lessonId, checkpoint.id, {
      timestampSeconds: checkpoint.timestampSeconds + 5,
      questionType: 'RADIO',
      title: checkpoint.question.title,
      settings: (checkpoint.question.settings ?? {}) as Record<string, unknown>,
      resumePolicy: 'any',
      options: checkpoint.question.options!.map((option) => ({
        label: option.label,
        value: option.value ?? null,
        isCorrect: option.isCorrect ?? false
      }))
    });

    const after = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    expect(after.answeredCheckpointIds).toContain(checkpoint.id);
  });

  it('clears earlier answers when a question is edited', async () => {
    const { updateVideoCheckpointService, listVideoCheckpointsForViewer } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );

    const before = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    expect(before.answeredCheckpointIds).toHaveLength(1);

    const checkpoint = before.checkpoints[0];
    await updateVideoCheckpointService(lessonId, checkpoint.id, {
      timestampSeconds: checkpoint.timestampSeconds,
      questionType: 'RADIO',
      title: 'Edited question',
      settings: {},
      resumePolicy: 'any',
      options: [
        { label: 'One', isCorrect: false },
        { label: 'Two', isCorrect: true }
      ]
    });

    const after = await listVideoCheckpointsForViewer(lessonId, studentId, true);
    expect(after.answeredCheckpointIds).toHaveLength(0);
  });

  it('completes a watch-tracked lesson only once the watch is done and every checkpoint is satisfied', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { createVideoCheckpointService, answerVideoCheckpointService } = await import(
      '@cio/core/services/lesson/video-checkpoint'
    );
    const { updateLessonWatchProgressService, getLessonCompletionService } = await import(
      '@cio/core/services/lesson/lesson'
    );

    const [watchLesson] = await db
      .insert(schema.lesson)
      .values({
        courseId,
        title: 'Watch gated lesson',
        slug: `watch-gated-${suffix}`,
        order: 4,
        completionPolicy: 'video_watch',
        videos: [{ type: 'upload', link: '/hls/test.m3u8', assetId: ASSET_ID, metadata: { duration: 60 } }]
      })
      .returning();
    const checkpoint = await createVideoCheckpointService(watchLesson.id, radioCheckpoint({ timestampSeconds: 30 }));
    const anyOption = checkpoint.question.options![0];

    const progress = await updateLessonWatchProgressService(watchLesson.id, studentId, {
      assetId: ASSET_ID,
      positionSeconds: 60,
      durationSeconds: 60,
      playedDeltaSeconds: 60
    });
    expect(progress.isComplete).toBe(true);
    expect(progress.didJustComplete).toBe(false);
    expect((await getLessonCompletionService(watchLesson.id, studentId))?.isComplete ?? false).toBe(false);

    const answered = await answerVideoCheckpointService(watchLesson.id, checkpoint.id, studentId, {
      type: 'RADIO',
      optionId: Number(anyOption.id)
    });
    expect(answered.didJustComplete).toBe(true);
    expect((await getLessonCompletionService(watchLesson.id, studentId))?.isComplete).toBe(true);
  });

  it('copies checkpoints to a cloned lesson and removes them when the video is detached', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { copyLessonVideoCheckpoints, deleteLessonVideoCheckpointsExceptAssets, listLessonVideoCheckpoints } =
      await import('@db/queries/lesson');

    const [clone] = await db
      .insert(schema.lesson)
      .values({ courseId, title: 'Clone', slug: `clone-${suffix}`, order: 3, videos: [] })
      .returning();

    const copied = await copyLessonVideoCheckpoints(new Map([[lessonId, clone.id]]), new Map());
    expect(copied).toBe(1);
    expect(await listLessonVideoCheckpoints(clone.id)).toHaveLength(1);

    const removed = await deleteLessonVideoCheckpointsExceptAssets(clone.id, [OTHER_ASSET_ID]);
    expect(removed).toBe(1);
    expect(await listLessonVideoCheckpoints(clone.id)).toHaveLength(0);
  });

  it('deletes a student’s answers when their course progress is reset', async () => {
    const { deleteLessonVideoCheckpointAnswersForProfile, getLessonVideoCheckpointAnswersForProfile } = await import(
      '@db/queries/lesson'
    );

    const removed = await deleteLessonVideoCheckpointAnswersForProfile(studentId, [lessonId, manualLessonId]);
    expect(removed).toBeGreaterThan(0);
    expect(await getLessonVideoCheckpointAnswersForProfile(manualLessonId, studentId)).toHaveLength(0);
  });

  it('cascades checkpoints when the lesson is deleted', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { listLessonVideoCheckpoints } = await import('@db/queries/lesson');

    await db.delete(schema.lesson).where(eq(schema.lesson.id, lessonId));
    expect(await listLessonVideoCheckpoints(lessonId)).toHaveLength(0);
  });
});
