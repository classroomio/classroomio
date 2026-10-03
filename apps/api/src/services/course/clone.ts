import { db, type DbOrTxClient } from '@db/drizzle';
import { TAsset, TCourse, TCourseSection, TLesson } from '@db/types';
import {
  addGroupMember,
  createCourse,
  createCourseSections,
  createExerciseSections,
  createExercises,
  createGroup,
  createLessonLanguages,
  createLessons,
  createOptions,
  createAsset,
  createQuestions,
  createAssetUsage,
  deleteAssetUsagesByTargetSlots,
  getActiveAssetBySourceUrl,
  getAssetsByIds,
  getCourseById,
  getCourseOrganizationId,
  getCourseSectionsByCourseId,
  getExerciseSectionsByExerciseIds,
  getExercisesByCourseId,
  getLessonLanguagesByLessonIds,
  getLessonsByCourseId,
  getOptionsByQuestionIds,
  getQuestionsByExerciseIds,
  stampCopiedTemplateUnits,
  syncOptionIdSequence,
  updateCourse,
  updateExerciseSection
} from '@db/queries';

import { ROLE } from '@cio/utils/constants';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { transferUploadedAsset, withAssetStorageRollback } from '@cio/core/services/assets/asset-transfer';

const ASSET_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

export type CloneCourseOptions = {
  title: string;
  userId: string;
  description?: string;
  slug?: string | null;
  organizationId?: string;
  isTemplate?: boolean;
  isPublished?: boolean;
  templateId?: string | null;
  setSourceIds?: boolean;
};

function collectAssetIds(value: unknown): string[] {
  const matches = JSON.stringify(value).match(ASSET_ID_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

function replaceAssetIds<T>(value: T, replacements: Map<string, string>): T {
  if (replacements.size === 0) return value;

  let serialized = JSON.stringify(value);
  for (const [source, copy] of replacements) {
    if (source !== copy) {
      serialized = serialized.split(source).join(copy);
    }
  }

  return JSON.parse(serialized) as T;
}

export async function remapContentAssets<T>(
  value: T,
  sourceOrgId: string | null | undefined,
  targetOrgId: string | null | undefined,
  userId: string,
  dbClient: DbOrTxClient = db
) {
  if (!sourceOrgId || !targetOrgId || sourceOrgId === targetOrgId) return value;

  const assetIds = collectAssetIds(value);
  if (assetIds.length === 0) return value;

  const copiedIds = await copyAssetsIntoOrg(assetIds, targetOrgId, userId, sourceOrgId, dbClient);
  return replaceAssetIds(value, copiedIds);
}

type LessonAssetRefs = Pick<TLesson, 'id' | 'videos' | 'documents'>;

const LESSON_MEDIA_SLOTS = ['lesson_video', 'lesson_document'];

/**
 * Makes each lesson's `lesson_video` and `lesson_document` usages match the videos
 * and documents it now points at, so replaced media stops showing as in use and
 * current media shows as in use in the target org's library. References to assets
 * outside `organizationId` are skipped. No background media work is queued.
 */
export async function syncLessonAssetUsages(
  lessons: LessonAssetRefs[],
  organizationId: string,
  userId: string,
  dbClient: DbOrTxClient = db
) {
  const slots = lessons.flatMap((lesson) => [
    ...(lesson.videos ?? []).map((video, position) => ({
      lessonId: lesson.id,
      assetId: video.assetId,
      slotType: 'lesson_video',
      position
    })),
    ...(lesson.documents ?? []).map((document, position) => ({
      lessonId: lesson.id,
      assetId: document.assetId,
      slotType: 'lesson_document',
      position
    }))
  ]);
  const referencedIds = [...new Set(slots.flatMap((slot) => (slot.assetId ? [slot.assetId] : [])))];
  const ownedAssets = await getAssetsByIds(referencedIds, organizationId, dbClient);
  const ownedIds = new Set(ownedAssets.map((asset) => asset.id));

  for (const lesson of lessons) {
    await deleteAssetUsagesByTargetSlots('lesson', lesson.id, LESSON_MEDIA_SLOTS, dbClient);
  }

  for (const slot of slots) {
    if (!slot.assetId || !ownedIds.has(slot.assetId)) continue;

    await createAssetUsage(
      {
        organizationId,
        assetId: slot.assetId,
        targetType: 'lesson',
        targetId: slot.lessonId,
        slotType: slot.slotType,
        position: slot.position,
        createdByProfileId: userId
      },
      dbClient
    );
  }
}

async function copyAssetsIntoOrg(
  assetIds: string[],
  organizationId: string,
  userId: string,
  sourceOrgId: string,
  dbClient: DbOrTxClient
) {
  const assets = await getAssetsByIds(assetIds, sourceOrgId, dbClient);
  const replacements = new Map<string, string>();

  for (const asset of assets) {
    const copied = await copyAsset(asset, organizationId, userId, dbClient);
    for (const [source, copy] of copied) replacements.set(source, copy);
  }

  return replacements;
}

/**
 * Brings an asset into `organizationId` and returns the source → copy pairs to
 * rewrite in content. Uploaded files are transferred into storage the target org
 * owns; external links reuse the org's asset for the same URL when there is one.
 */
async function copyAsset(
  asset: TAsset,
  organizationId: string,
  userId: string,
  dbClient: DbOrTxClient
): Promise<[string, string][]> {
  if (asset.organizationId === organizationId) return [];

  if (asset.provider === 'upload') {
    const transfer = await transferUploadedAsset(asset, organizationId, userId, dbClient);
    return transfer.replacements;
  }

  const existing = asset.sourceUrl
    ? await getActiveAssetBySourceUrl(organizationId, asset.provider, asset.sourceUrl, dbClient)
    : null;
  if (existing) return [[asset.id, existing.id]];

  const created = await createAsset(
    {
      organizationId,
      kind: asset.kind,
      provider: asset.provider,
      storageProvider: asset.storageProvider,
      sourceUrl: asset.sourceUrl,
      mimeType: asset.mimeType,
      title: asset.title,
      description: asset.description,
      thumbnailUrl: asset.thumbnailUrl,
      durationSeconds: asset.durationSeconds,
      aspectRatio: asset.aspectRatio,
      isExternal: asset.isExternal,
      status: asset.status,
      metadata: asset.metadata,
      createdByProfileId: userId
    },
    dbClient
  );

  return [[asset.id, created.id]];
}

function metadataWithoutReviews(metadata: TCourse['metadata']): TCourse['metadata'] {
  const next = { ...metadata };
  delete next.reviews;
  return next;
}

export async function cloneCourse(
  courseId: string,
  options: CloneCourseOptions,
  dbClient?: DbOrTxClient
): Promise<TCourse> {
  if (dbClient) {
    const created = await cloneCourseWithClient(courseId, options, dbClient);
    return created.course;
  }

  const created = await withAssetStorageRollback(() =>
    db.transaction(async (tx) => cloneCourseWithClient(courseId, options, tx))
  );
  await invalidateOrgStats(created.organizationId);

  return created.course;
}

async function cloneCourseWithClient(
  courseId: string,
  options: CloneCourseOptions,
  tx: DbOrTxClient
): Promise<{ course: TCourse; organizationId: string | null }> {
  const [course] = await getCourseById(courseId, tx);
  if (!course) {
    throw new Error('Course not found');
  }

  const sourceOrgId = await getCourseOrganizationId(courseId, tx);
  const targetOrgId = options.organizationId ?? sourceOrgId ?? undefined;
  const crossOrg = Boolean(sourceOrgId && targetOrgId && sourceOrgId !== targetOrgId);
  const syncedAt = new Date().toISOString();
  const preserveSchedule = options.isTemplate === true || options.setSourceIds === true;

  const oldSections = await getCourseSectionsByCourseId(courseId, tx);
  const oldLessons = await getLessonsByCourseId(courseId, tx);
  const oldExercises = await getExercisesByCourseId(courseId, {}, tx);
  const oldLessonIds = oldLessons.map((lesson) => lesson.id);
  const oldExerciseIds = oldExercises.map((exercise) => exercise.id);
  const oldLessonLanguages = oldLessonIds.length > 0 ? await getLessonLanguagesByLessonIds(oldLessonIds, tx) : [];
  const oldExerciseSections =
    oldExerciseIds.length > 0 ? await getExerciseSectionsByExerciseIds(oldExerciseIds, tx) : [];
  const oldQuestions = oldExerciseIds.length > 0 ? await getQuestionsByExerciseIds(oldExerciseIds, tx) : [];
  const oldQuestionIds = oldQuestions.map((question) => question.id).filter((id) => id !== undefined);
  const oldOptions = oldQuestionIds.length > 0 ? await getOptionsByQuestionIds(oldQuestionIds, tx) : [];

  const assetIds =
    crossOrg && sourceOrgId
      ? await copyAssetsIntoOrg(
          collectAssetIds({
            course,
            oldLessons,
            oldLessonLanguages,
            oldExercises,
            oldExerciseSections,
            oldQuestions,
            oldOptions
          }),
          targetOrgId!,
          options.userId,
          sourceOrgId,
          tx
        )
      : new Map<string, string>();

  const courseCopy = replaceAssetIds(course, assetIds);
  const [newGroup] = await createGroup(
    {
      name: options.title,
      description: options.description ?? course.description,
      organizationId: targetOrgId
    },
    tx
  );
  if (!newGroup) {
    throw new Error('Failed to create a group for the copied course');
  }

  const [newCourse] = await createCourse(
    {
      title: options.title,
      description: options.description ?? courseCopy.description,
      overview: courseCopy.overview,
      groupId: newGroup.id,
      isTemplate: options.isTemplate ?? false,
      publicForAll: false,
      templateId: options.templateId ?? null,
      slug: options.slug ?? null,
      metadata: metadataWithoutReviews(courseCopy.metadata),
      cost: courseCopy.cost,
      currency: courseCopy.currency,
      bannerImage: courseCopy.bannerImage,
      isPublished: options.isPublished ?? courseCopy.isPublished,
      certificate: courseCopy.certificate,
      compliance: courseCopy.compliance,
      callout: courseCopy.callout,
      status: courseCopy.status,
      type: courseCopy.type
    },
    tx
  );
  if (!newCourse) {
    throw new Error('Failed to create the copied course');
  }

  await addGroupMember(
    {
      profileId: options.userId,
      email: '',
      groupId: newGroup.id,
      roleId: ROLE.TUTOR
    },
    tx
  );

  let newSections: TCourseSection[] = [];
  const sectionMap = new Map<string, string>();
  if (oldSections.length > 0) {
    newSections = await createCourseSections(
      oldSections.map((section) => ({
        title: section.title,
        order: section.order,
        courseId: newCourse.id,
        sourceId: options.setSourceIds ? section.id : null,
        sourceSyncedAt: options.setSourceIds ? syncedAt : null
      })),
      tx
    );
    oldSections.forEach((section, index) => {
      sectionMap.set(section.id, newSections[index].id);
    });
  }

  const lessonCopies = replaceAssetIds(oldLessons, assetIds);
  const newLessons =
    lessonCopies.length > 0
      ? await createLessons(
          lessonCopies.map((lesson) => ({
            note: lesson.note,
            videoUrl: lesson.videoUrl,
            slideUrl: lesson.slideUrl,
            slides: lesson.slides,
            courseId: newCourse.id,
            title: lesson.title,
            public: lesson.public,
            lessonAt: lesson.lessonAt,
            teacherId: crossOrg ? null : lesson.teacherId,
            isComplete: false,
            callUrl: crossOrg ? null : lesson.callUrl,
            order: lesson.order,
            isUnlocked: lesson.isUnlocked,
            completionPolicy: lesson.completionPolicy,
            videoWatchThreshold: lesson.videoWatchThreshold,
            commentsEnabled: lesson.commentsEnabled,
            videos: lesson.videos,
            documents: lesson.documents,
            sectionId: lesson.sectionId ? (sectionMap.get(lesson.sectionId) ?? null) : null,
            slug: lesson.slug,
            sourceId: options.setSourceIds ? lesson.id : null,
            sourceSyncedAt: options.setSourceIds ? syncedAt : null
          })),
          tx
        )
      : [];

  const lessonMap = new Map<string, string>();
  oldLessons.forEach((lesson, index) => {
    const created = newLessons[index];
    if (created) lessonMap.set(lesson.id, created.id);
  });

  if (targetOrgId) {
    await syncLessonAssetUsages(newLessons, targetOrgId, options.userId, tx);
  }

  const languageCopies = replaceAssetIds(oldLessonLanguages, assetIds);
  if (languageCopies.length > 0) {
    await createLessonLanguages(
      languageCopies.map((language) => ({
        content: language.content,
        locale: language.locale,
        lessonId: lessonMap.get(language.lessonId!)!
      })),
      tx
    );
  }

  const exerciseCopies = replaceAssetIds(oldExercises, assetIds);
  const newExercises =
    exerciseCopies.length > 0
      ? await createExercises(
          exerciseCopies.map((exercise) => ({
            title: exercise.title,
            description: exercise.description,
            dueBy: preserveSchedule ? exercise.dueBy : new Date().toISOString(),
            lessonId: exercise.lessonId ? (lessonMap.get(exercise.lessonId) ?? null) : null,
            courseId: newCourse.id,
            sectionId: exercise.sectionId ? (sectionMap.get(exercise.sectionId) ?? null) : null,
            sectionDisplayMode: exercise.sectionDisplayMode,
            order: exercise.order,
            isUnlocked: exercise.isUnlocked,
            allowMultipleAttempts: exercise.allowMultipleAttempts,
            completionPolicy: exercise.completionPolicy,
            passThreshold: exercise.passThreshold,
            slug: exercise.slug,
            sourceId: options.setSourceIds ? exercise.id : null,
            sourceSyncedAt: options.setSourceIds ? syncedAt : null
          })),
          tx
        )
      : [];

  const exerciseMap = new Map<string, string>();
  oldExercises.forEach((exercise, index) => {
    const created = newExercises[index];
    if (created) exerciseMap.set(exercise.id, created.id);
  });

  const exerciseSectionMap = new Map<string, string>();
  if (oldExerciseSections.length > 0) {
    const newExerciseSections = await createExerciseSections(
      oldExerciseSections.map((section) => ({
        title: section.title,
        description: section.description,
        order: section.order,
        colorTheme: section.colorTheme,
        afterBehavior: section.afterBehavior,
        exerciseId: exerciseMap.get(section.exerciseId)!
      })),
      tx
    );

    oldExerciseSections.forEach((section, index) => {
      const created = newExerciseSections[index];
      if (created) exerciseSectionMap.set(section.id, created.id);
    });

    await Promise.all(
      newExerciseSections.map((section) => {
        const behavior = section.afterBehavior as { action?: string; exerciseSectionId?: string };
        if (behavior.action !== 'go_to_section' || !behavior.exerciseSectionId) return null;

        const remappedId = exerciseSectionMap.get(behavior.exerciseSectionId);
        if (!remappedId) return null;

        return updateExerciseSection(
          section.id,
          {
            afterBehavior: { action: 'go_to_section', exerciseSectionId: remappedId }
          },
          tx
        );
      })
    );
  }

  const questionCopies = replaceAssetIds(oldQuestions, assetIds);
  const newQuestions =
    questionCopies.length > 0
      ? await createQuestions(
          questionCopies.map((question) => ({
            name: question.name,
            title: question.title,
            points: question.points,
            order: question.order,
            questionTypeId: question.questionTypeId,
            settings: question.settings,
            exerciseSectionId: question.exerciseSectionId
              ? (exerciseSectionMap.get(question.exerciseSectionId) ?? null)
              : null,
            exerciseId: exerciseMap.get(question.exerciseId)!
          })),
          tx
        )
      : [];

  const questionMap = new Map<number, number>();
  oldQuestions.forEach((question, index) => {
    const createdId = newQuestions[index]?.id;
    if (question.id !== undefined && createdId !== undefined) {
      questionMap.set(question.id, createdId);
    }
  });

  const optionCopies = replaceAssetIds(oldOptions, assetIds);
  const optionsToCreate = optionCopies
    .map((option) => {
      const questionId = questionMap.get(option.questionId);
      if (questionId === undefined) return null;

      return {
        value: option.value,
        label: option.label,
        isCorrect: option.isCorrect,
        settings: option.settings,
        questionId
      };
    })
    .filter((option) => option !== null);

  if (optionsToCreate.length > 0) {
    await syncOptionIdSequence(tx);
    await createOptions(optionsToCreate, tx);
  }

  const sourceExerciseId = courseCopy.certificate?.requiredExerciseId;
  if (sourceExerciseId) {
    const mappedExerciseId = exerciseMap.get(sourceExerciseId) ?? null;
    const certificate = {
      ...(courseCopy.certificate ?? {}),
      requiredExerciseId: mappedExerciseId
    };
    await updateCourse(newCourse.id, { certificate }, tx);
  }

  if (options.setSourceIds) {
    const stampedAt = new Date().toISOString();
    await stampCopiedTemplateUnits(
      {
        sectionIds: newSections.map((section) => section.id),
        lessonIds: newLessons.map((lesson) => lesson.id),
        exerciseIds: newExercises.map((exercise) => exercise.id),
        syncedAt: stampedAt
      },
      tx
    );
  }

  return { course: newCourse, organizationId: targetOrgId ?? newGroup.organizationId };
}
