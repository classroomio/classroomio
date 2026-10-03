import { db, type DbOrTxClient } from '@db/drizzle';
import { createAsset, createAssetUsage, getActiveAssetBySourceUrl } from '@db/queries/assets';
import {
  createCourse,
  createCourseSections,
  createTemplateHighlights,
  getCourseBySeedKey,
  isCourseSlugTaken,
  retireSeededTemplates,
  updateCourse
} from '@db/queries/course';
import {
  createExerciseSections,
  createExercises,
  createOptions,
  createQuestions,
  updateExerciseSection
} from '@db/queries/exercise';
import { createGroup } from '@db/queries/group';
import { createLessonLanguages, createLessons } from '@db/queries/lesson';
import { getOrganizationById } from '@db/queries/organization';
import type { TNewCourse } from '@db/types';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';

import type {
  LaunchExercise,
  LaunchExerciseSection,
  LaunchLesson,
  LaunchQuestion,
  LaunchTemplateFixture,
  LessonVideo
} from './fixtures';
import { launchTemplateFixtures } from './fixtures';

async function findOrCreateYoutubeAsset(orgId: string, video: LessonVideo, dbClient: DbOrTxClient) {
  const sourceUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  const existing = await getActiveAssetBySourceUrl(orgId, 'youtube', sourceUrl, dbClient);
  if (existing) return existing;

  const thumbnailUrl = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return createAsset(
    {
      organizationId: orgId,
      kind: 'video',
      provider: 'youtube',
      storageProvider: 'external',
      sourceUrl,
      isExternal: true,
      title: video.title,
      thumbnailUrl,
      metadata: { videoId: video.youtubeId, title: video.title, thumbnailUrl }
    },
    dbClient
  );
}

/**
 * Registers each lesson video as a YouTube asset in the org's media library and
 * returns the lesson `videos` entries pointing at those assets. Assets are written
 * through the query layer so no caption or transcript fetch is queued.
 */
async function lessonVideos(orgId: string, lesson: LaunchLesson, dbClient: DbOrTxClient) {
  const videos = [];
  for (const video of lesson.videos ?? []) {
    const asset = await findOrCreateYoutubeAsset(orgId, video, dbClient);
    const link = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    const thumbnailUrl = asset.thumbnailUrl ?? undefined;
    videos.push({
      type: 'youtube' as const,
      link,
      assetId: asset.id,
      fileName: video.title,
      metadata: { videoId: video.youtubeId, title: video.title, thumbnailUrl }
    });
  }

  return videos;
}

function questionSettings(question: LaunchQuestion) {
  if (question.type === 'TRUE_FALSE') {
    const correct = question.options?.find((option) => option.correct);
    if (correct?.label === 'True') return { correctValue: true };
    if (correct?.label === 'False') return { correctValue: false };
  }

  if (question.type === 'FILL_BLANK') {
    const accepted = (question.options ?? []).filter((option) => option.correct).map((option) => option.label);
    return { acceptedAnswers: accepted.join(', ') };
  }

  if (question.type === 'NUMERIC') {
    const accepted = question.options?.find((option) => option.correct)?.label;
    const correctValue = accepted != null ? Number(accepted) : null;
    return { correctValue, tolerance: 0 };
  }

  if (question.type === 'SHORT_ANSWER') {
    const accepted = (question.options ?? []).filter((option) => option.correct).map((option) => option.label);
    return { acceptedAnswers: accepted.join(',') };
  }

  if (question.type === 'WORD_BANK') {
    const correctAnswers = (question.options ?? []).filter((option) => option.correct).map((option) => option.label);
    const distractors = (question.options ?? []).filter((option) => !option.correct).map((option) => option.label);
    return { template: question.template ?? '', correctAnswers, distractors };
  }

  if (question.type === 'ORDERING') {
    const items = (question.options ?? []).map((option) => option.label);
    return { items };
  }

  if (question.type === 'MATCHING') {
    const pairs = (question.options ?? [])
      .filter((option) => option.correct)
      .map((option) => {
        const [left, right] = option.label.split('→').map((part) => part.trim());
        return { left, right };
      })
      .filter((pair) => pair.left && pair.right);

    return { pairs };
  }

  return {};
}

async function allocateTemplateSlug(preferred: string, dbClient: DbOrTxClient) {
  const candidates = [preferred, `${preferred}-classroomio`];
  for (let suffix = 2; suffix < 100; suffix += 1) {
    candidates.push(`${preferred}-classroomio-${suffix}`);
  }

  for (const candidate of candidates) {
    const taken = await isCourseSlugTaken(candidate, dbClient);
    if (!taken) return candidate;
  }

  throw new Error(`No free slug for launch template ${preferred}`);
}

async function insertQuestions(
  exerciseId: string,
  questions: LaunchQuestion[],
  dbClient: DbOrTxClient,
  exerciseSectionId?: string
) {
  if (questions.length === 0) return;

  const created = await createQuestions(
    questions.map((question, index) => ({
      exerciseId,
      exerciseSectionId,
      questionTypeId: QUESTION_TYPE[question.type],
      title: question.title,
      order: index + 1,
      points: 1,
      settings: questionSettings(question)
    })),
    dbClient
  );

  const options = created.flatMap((question, index) => {
    const source = questions[index];
    return (source?.options ?? []).map((option) => ({
      questionId: question.id,
      label: option.label,
      isCorrect: option.correct ?? false
    }));
  });

  if (options.length > 0) await createOptions(options, dbClient);
}

async function insertExercise(
  courseId: string,
  sectionId: string,
  exercise: LaunchExercise,
  order: number,
  dbClient: DbOrTxClient
) {
  const [created] = await createExercises(
    [
      {
        title: exercise.title,
        description: exercise.description,
        courseId,
        sectionId,
        order
      }
    ],
    dbClient
  );

  if (!created) return null;

  if (exercise.sections && exercise.sections.length > 0) {
    const createdSections = await createExerciseSections(
      exercise.sections.map((section: LaunchExerciseSection, index: number) => ({
        exerciseId: created.id,
        title: section.title,
        order: index
      })),
      dbClient
    );
    const sectionIdByTitle = new Map(createdSections.map((section) => [section.title, section.id]));

    for (const [index, section] of exercise.sections.entries()) {
      const exerciseSectionId = createdSections[index]?.id;
      if (!exerciseSectionId) continue;

      await insertQuestions(created.id, section.questions, dbClient, exerciseSectionId);

      if (section.goToTitle) {
        const targetId = sectionIdByTitle.get(section.goToTitle);
        if (targetId) {
          await updateExerciseSection(
            exerciseSectionId,
            { afterBehavior: { action: 'go_to_section', exerciseSectionId: targetId } },
            dbClient
          );
        }
        continue;
      }

      if (!section.submit) continue;

      await updateExerciseSection(exerciseSectionId, { afterBehavior: { action: 'submit' } }, dbClient);
    }

    return created.id;
  }

  await insertQuestions(created.id, exercise.questions ?? [], dbClient);
  return created.id;
}

async function insertLaunchTemplate(orgId: string, fixture: LaunchTemplateFixture, dbClient: DbOrTxClient) {
  const existing = await getCourseBySeedKey(fixture.slug, dbClient);
  if (existing) return;

  const slug = await allocateTemplateSlug(fixture.slug, dbClient);
  const displayOrder = launchTemplateFixtures.indexOf(fixture) + 1;

  const [group] = await createGroup(
    {
      name: fixture.title,
      description: fixture.description,
      organizationId: orgId
    },
    dbClient
  );
  if (!group) {
    throw new Error(`Failed to create a group for launch template ${fixture.slug}`);
  }

  const [course] = await createCourse(
    {
      title: fixture.title,
      description: fixture.description,
      slug,
      type: fixture.type,
      bannerImage: fixture.bannerImage,
      groupId: group.id,
      isTemplate: true,
      publicForAll: true,
      seedKey: fixture.slug,
      displayOrder,
      isPublished: false,
      status: 'ACTIVE',
      metadata: fixture.metadata as TNewCourse['metadata'],
      certificate: (fixture.certificate ?? {}) as TNewCourse['certificate'],
      compliance: fixture.compliance as TNewCourse['compliance'],
      callout: fixture.callout as TNewCourse['callout']
    },
    dbClient
  );

  if (!course) {
    throw new Error(`Failed to create launch template ${fixture.slug}`);
  }

  const sections = await createCourseSections(
    fixture.sections.map((section, index) => ({
      courseId: course.id,
      title: section.title,
      order: index + 1
    })),
    dbClient
  );

  let finalExerciseId: string | null = null;

  for (const [sectionIndex, section] of fixture.sections.entries()) {
    const courseSectionId = sections[sectionIndex]?.id;
    if (!courseSectionId) continue;

    if (section.lessons.length > 0) {
      const videosByLesson: Awaited<ReturnType<typeof lessonVideos>>[] = [];
      for (const lesson of section.lessons) {
        const videos = await lessonVideos(orgId, lesson, dbClient);
        videosByLesson.push(videos);
      }

      const lessons = await createLessons(
        section.lessons.map((lesson, index) => ({
          courseId: course.id,
          sectionId: courseSectionId,
          title: lesson.title,
          order: index + 1,
          isUnlocked: true,
          public: fixture.type === 'PUBLIC',
          videos: videosByLesson[index] ?? []
        })),
        dbClient
      );

      for (const [lessonIndex, lesson] of lessons.entries()) {
        for (const [position, video] of (videosByLesson[lessonIndex] ?? []).entries()) {
          await createAssetUsage(
            {
              organizationId: orgId,
              assetId: video.assetId,
              targetType: 'lesson',
              targetId: lesson.id,
              slotType: 'lesson_video',
              position
            },
            dbClient
          );
        }
      }

      const languageRows: { lessonId: string; locale: 'en' | 'fr'; content: string }[] = lessons.flatMap(
        (lesson, index) => {
          const source = section.lessons[index];
          if (!source) return [];

          const rows: { lessonId: string; locale: 'en' | 'fr'; content: string }[] = [
            { lessonId: lesson.id, locale: 'en', content: source.content }
          ];
          for (const translation of source.translations ?? []) {
            rows.push({
              lessonId: lesson.id,
              locale: translation.locale,
              content: translation.content
            });
          }

          return rows;
        }
      );

      if (languageRows.length > 0) {
        await createLessonLanguages(languageRows, dbClient);
      }
    }

    for (const [exerciseIndex, exercise] of section.exercises.entries()) {
      const exerciseId = await insertExercise(
        course.id,
        courseSectionId,
        exercise,
        section.lessons.length + exerciseIndex + 1,
        dbClient
      );
      if (exercise.final && exerciseId) finalExerciseId = exerciseId;
    }
  }

  if (finalExerciseId) {
    await updateCourse(
      course.id,
      {
        certificate: {
          ...(fixture.certificate ?? {}),
          requiredExerciseId: finalExerciseId
        } as TNewCourse['certificate']
      },
      dbClient
    );
  }

  await createTemplateHighlights(
    fixture.highlights.map((highlight, index) => ({
      courseId: course.id,
      position: index + 1,
      title: highlight.title,
      description: highlight.description
    })),
    dbClient
  );
}

/**
 * Inserts the launch templates into an existing org.
 * Returns false when that org does not exist.
 * Skips a fixture whose seed key is already stored. Pass a client to join the caller's transaction.
 */
export async function seedLaunchTemplates(orgId: string, dbClient: DbOrTxClient = db) {
  const organization = await getOrganizationById(orgId, dbClient);
  if (!organization) return false;

  const failures: string[] = [];
  for (const fixture of launchTemplateFixtures) {
    try {
      if (dbClient === db) {
        await db.transaction(async (tx) => {
          await insertLaunchTemplate(organization.id, fixture, tx);
        });
      } else {
        await insertLaunchTemplate(organization.id, fixture, dbClient);
      }
    } catch (error) {
      failures.push(fixture.slug);
      console.error('seedLaunchTemplates error:', fixture.slug, error);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed to seed launch templates: ${failures.join(', ')}`);
  }

  return true;
}

/**
 * Retires the org's previously seeded launch templates so the next seed inserts them fresh.
 */
export async function resetLaunchTemplates(orgId: string) {
  const retired = await retireSeededTemplates(orgId);
  return retired.length;
}
