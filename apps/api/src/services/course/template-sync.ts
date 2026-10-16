import type { TCourse, TCourseActivity, TCourseSection, TExercise, TLesson, TLessonLanguage } from '@db/types';
import type { DbOrTxClient } from '@db/drizzle';
import { db } from '@db/drizzle';
import {
  countSubmissionsByExerciseIds,
  createActivities,
  createCourseSections,
  createExerciseSections,
  createExercises,
  createLessonLanguage,
  createLessons,
  createOptions,
  createQuestions,
  deleteExerciseChildren,
  getActivitiesByCourseId,
  getActivityScormByActivityId,
  getAssetById,
  createAssetUsage,
  getCourseById,
  getCourseOrganizationId,
  getCourseSectionsByCourseId,
  getCurrentPackageVersion,
  getExerciseSectionsByExerciseIds,
  getExercisesByCourseId,
  getLessonLanguagesByLessonIds,
  getLessonsByCourseId,
  getOptionsByQuestionIds,
  getQuestionsByExerciseIds,
  listCurrentPackageVersionsForActivities,
  listTemplateSettingSync,
  shiftCourseRootOrders,
  setCurrentPackageVersion,
  shiftActivityOrders,
  shiftExerciseOrders,
  shiftLessonOrders,
  stampCopiedTemplateUnits,
  updateActivity,
  updateCourse,
  updateCourseSection,
  updateExercise,
  updateExerciseSection,
  updateLesson,
  updateLessonLanguage,
  upsertActivityScorm,
  upsertTemplateSettingSync,
  canReadLinkedTemplate,
  lockCourseForUpdate
} from '@db/queries';
import { env } from '@cio/core/config/env';
import { ACTIVITY_PROVIDERS } from '@cio/core/services/activity/providers';
import { ACTIVITY_PACKAGE_SLOT } from '@cio/utils/validation/assets/assets';
import type { TActivityKind } from '@cio/utils/constants/activity';
import { recordLessonLanguageVersion } from '@cio/core/services/lesson-version';
import {
  copyPackageVersionToAsset,
  transferScormPackageAsset,
  withAssetStorageRollback
} from '@cio/core/services/assets/asset-transfer';
import {
  applySettingChanges,
  detectSettingChanges,
  detectTemplateContentChanges,
  insertionOrder,
  preparePullSelection,
  type DetectedSettingChange,
  type DetectedTemplateUnit,
  type SettingCarrier,
  type SettingCertificate,
  type SettingMetadata,
  type SyncableSettingKey,
  type SyncActivity,
  type SyncExercise,
  type SyncLesson,
  type SyncSection
} from '@cio/utils/validation/course';

import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { syncLessonAssetUsages, remapContentAssets } from '@api/services/course/clone';

type SyncGraph = {
  sections: TCourseSection[];
  lessons: TLesson[];
  languages: TLessonLanguage[];
  exercises: TExercise[];
  activities: TCourseActivity[];
  activityPackages: Map<string, { versionId: string | null; versionUpdatedAt: string | null }>;
  exerciseSections: Awaited<ReturnType<typeof getExerciseSectionsByExerciseIds>>;
  questions: Awaited<ReturnType<typeof getQuestionsByExerciseIds>>;
  options: Awaited<ReturnType<typeof getOptionsByQuestionIds>>;
  submissionCounts: Map<string, number>;
};

function latestIso(values: (string | null | undefined)[]) {
  let latest: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (!latest || Date.parse(value) > Date.parse(latest)) latest = value;
  }

  return latest;
}

function toCarrier(course: TCourse): SettingCarrier {
  return {
    description: course.description,
    bannerImage: course.bannerImage,
    cost: course.cost,
    currency: course.currency,
    updatedAt: course.updatedAt,
    metadata: (course.metadata ?? null) as SettingMetadata | null,
    certificate: (course.certificate ?? null) as SettingCertificate | null
  };
}

function sourceOrders(items: { sourceId: string | null; order: number }[]) {
  const orders = new Map<string, { order: number }>();
  for (const item of items) {
    if (item.sourceId) orders.set(item.sourceId, { order: item.order });
  }

  return orders;
}

function bumpOrders<T extends { order: number }>(items: T[], fromOrder: number) {
  for (const item of items) {
    if (item.order >= fromOrder) item.order += 1;
  }
}

async function claimSectionLessonOrder(
  templateLessons: TLesson[],
  courseGraph: SyncGraph,
  lesson: TLesson,
  parentId: string,
  courseId: string,
  client: DbOrTxClient
) {
  const templateSiblings = templateLessons.filter((sibling) => sibling.sectionId === lesson.sectionId);
  const placed = courseGraph.lessons.filter((sibling) => sibling.sectionId === parentId);
  const order = insertionOrder(templateSiblings, lesson.id, sourceOrders(placed), placed);
  await shiftLessonOrders(courseId, parentId, order, client);
  await shiftExerciseOrders(courseId, { sectionId: parentId }, order, client);
  await shiftActivityOrders(courseId, parentId, order, client);
  bumpOrders(placed, order);
  bumpOrders(
    courseGraph.exercises.filter((sibling) => sibling.sectionId === parentId),
    order
  );
  bumpOrders(
    courseGraph.activities.filter((sibling) => sibling.sectionId === parentId),
    order
  );

  return order;
}

async function claimSectionActivityOrder(
  templateActivities: TCourseActivity[],
  courseGraph: SyncGraph,
  activity: TCourseActivity,
  parentId: string,
  courseId: string,
  client: DbOrTxClient
) {
  const templateSiblings = templateActivities.filter((sibling) => sibling.sectionId === activity.sectionId);
  const placed = courseGraph.activities.filter((sibling) => sibling.sectionId === parentId);
  const order = insertionOrder(templateSiblings, activity.id, sourceOrders(placed), placed);
  await shiftLessonOrders(courseId, parentId, order, client);
  await shiftExerciseOrders(courseId, { sectionId: parentId }, order, client);
  await shiftActivityOrders(courseId, parentId, order, client);
  bumpOrders(placed, order);
  bumpOrders(
    courseGraph.lessons.filter((sibling) => sibling.sectionId === parentId),
    order
  );
  bumpOrders(
    courseGraph.exercises.filter((sibling) => sibling.sectionId === parentId),
    order
  );

  return order;
}

async function claimNestedExerciseOrder(
  templateExercises: TExercise[],
  courseGraph: SyncGraph,
  exercise: TExercise,
  parent: { sectionId: string | null; lessonId: string | null },
  courseId: string,
  client: DbOrTxClient
) {
  const templateSiblings = templateExercises.filter((sibling) =>
    exercise.sectionId
      ? sibling.sectionId === exercise.sectionId
      : sibling.lessonId === exercise.lessonId && !sibling.sectionId
  );
  const placed = courseGraph.exercises.filter((sibling) =>
    parent.sectionId
      ? sibling.sectionId === parent.sectionId
      : sibling.lessonId === parent.lessonId && !sibling.sectionId
  );
  const order = insertionOrder(templateSiblings, exercise.id, sourceOrders(placed), placed);
  await shiftExerciseOrders(
    courseId,
    { sectionId: parent.sectionId, lessonId: parent.sectionId ? null : parent.lessonId },
    order,
    client
  );
  if (!parent.lessonId) {
    await shiftLessonOrders(courseId, parent.sectionId, order, client);
    await shiftActivityOrders(courseId, parent.sectionId, order, client);
    bumpOrders(
      courseGraph.lessons.filter((sibling) => (sibling.sectionId ?? null) === parent.sectionId),
      order
    );
    bumpOrders(
      courseGraph.activities.filter((sibling) => (sibling.sectionId ?? null) === parent.sectionId),
      order
    );
  }
  bumpOrders(placed, order);

  return order;
}

function rootEntries(graph: SyncGraph): { id: string; sourceId: string | null; order: number }[] {
  const rootLessons = graph.lessons.filter((lesson) => !lesson.sectionId);
  const rootExercises = graph.exercises.filter((exercise) => !exercise.sectionId && !exercise.lessonId);
  const rootActivities = graph.activities.filter((activity) => !activity.sectionId);

  return [...graph.sections, ...rootLessons, ...rootExercises, ...rootActivities];
}

/**
 * Picks the course order for a new top-level template entry and shifts every later top-level entry down one.
 */
async function claimRootOrder(
  templateGraph: SyncGraph,
  courseGraph: SyncGraph,
  templateEntryId: string,
  courseId: string,
  client: DbOrTxClient
) {
  const placed = rootEntries(courseGraph);
  const order = insertionOrder(rootEntries(templateGraph), templateEntryId, sourceOrders(placed), placed);
  await shiftCourseRootOrders(courseId, order, client);
  await shiftActivityOrders(courseId, null, order, client);
  bumpOrders(placed, order);

  return order;
}

async function loadGraph(courseId: string, client: DbOrTxClient): Promise<SyncGraph> {
  const sections = await getCourseSectionsByCourseId(courseId, client);
  const lessons = await getLessonsByCourseId(courseId, client);
  const exercises = await getExercisesByCourseId(courseId, {}, client);
  const activities = await getActivitiesByCourseId(courseId, client);
  const lessonIds = lessons.map((lesson) => lesson.id);
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const languages = lessonIds.length > 0 ? await getLessonLanguagesByLessonIds(lessonIds, client) : [];
  const exerciseSections = await getExerciseSectionsByExerciseIds(exerciseIds, client);
  const questions = await getQuestionsByExerciseIds(exerciseIds, client);
  const questionIds = questions.map((question) => question.id).filter((id): id is number => id !== undefined);
  const options = questionIds.length > 0 ? await getOptionsByQuestionIds(questionIds, client) : [];
  const submissionCounts = await countSubmissionsByExerciseIds(exerciseIds, client);
  const packageVersions = await listCurrentPackageVersionsForActivities(
    activities.map((activity) => activity.id),
    client
  );
  const activityPackages = new Map(
    packageVersions.map((entry) => [
      entry.activityId,
      { versionId: entry.versionId, versionUpdatedAt: entry.versionUpdatedAt }
    ])
  );

  return {
    sections,
    lessons,
    languages,
    exercises,
    activities,
    activityPackages,
    exerciseSections,
    questions,
    options,
    submissionCounts
  };
}

function snapshotSections(sections: TCourseSection[]): SyncSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
    order: section.order,
    sourceId: section.sourceId,
    sourceSyncedAt: section.sourceSyncedAt
  }));
}

function snapshotLessons(lessons: TLesson[], languages: TLessonLanguage[]): SyncLesson[] {
  return lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    order: lesson.order,
    sectionId: lesson.sectionId,
    sourceId: lesson.sourceId,
    sourceSyncedAt: lesson.sourceSyncedAt,
    locales: languages.flatMap((language) => {
      if (language.lessonId !== lesson.id || !language.locale) return [];

      return [{ locale: language.locale, updatedAt: language.updatedAt }];
    })
  }));
}

function snapshotActivities(graph: SyncGraph): SyncActivity[] {
  return graph.activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    order: activity.order,
    sectionId: activity.sectionId,
    sourceId: activity.sourceId,
    sourceSyncedAt: activity.sourceSyncedAt,
    packageVersionId: graph.activityPackages.get(activity.id)?.versionId ?? null,
    packageUpdatedAt: graph.activityPackages.get(activity.id)?.versionUpdatedAt ?? null
  }));
}

function snapshotExercises(graph: SyncGraph): SyncExercise[] {
  return graph.exercises.map((exercise) => {
    const sections = graph.exerciseSections.filter((section) => section.exerciseId === exercise.id);
    const questions = graph.questions.filter((question) => question.exerciseId === exercise.id);
    const questionIds = new Set(questions.map((question) => question.id));
    const options = graph.options.filter((option) => questionIds.has(option.questionId));

    return {
      id: exercise.id,
      title: exercise.title,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      order: exercise.order,
      sectionId: exercise.sectionId,
      lessonId: exercise.lessonId,
      sourceId: exercise.sourceId,
      sourceSyncedAt: exercise.sourceSyncedAt,
      childUpdatedAt: [
        ...sections.map((section) => section.updatedAt),
        ...questions.map((question) => question.updatedAt),
        ...options.map((option) => option.updatedAt)
      ].filter((updatedAt): updatedAt is string => typeof updatedAt === 'string'),
      submissionCount: graph.submissionCounts.get(exercise.id) ?? 0
    };
  });
}

async function requireLinkedCourse(courseId: string, orgId: string, client: DbOrTxClient = db) {
  const [course] = await getCourseById(courseId, client);
  if (!course || course.status === 'DELETED' || !course.templateId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseOrgId = await getCourseOrganizationId(courseId, client);
  if (courseOrgId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const [template] = await getCourseById(course.templateId, client);
  const templateOrgId = template ? await getCourseOrganizationId(template.id, client) : null;
  if (template && templateOrgId) {
    const allowed = canReadLinkedTemplate(template, templateOrgId, orgId, env.PLATFORM_TEMPLATES_ORG_ID);
    if (!allowed) {
      throw new AppError('Template not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }
  }

  return { course, template: template ?? null, templateOrgId, courseOrgId };
}

function detectFromGraphs(course: TCourse, templateGraph: SyncGraph, courseGraph: SyncGraph) {
  return detectTemplateContentChanges({
    courseCreatedAt: course.createdAt,
    templateSections: snapshotSections(templateGraph.sections),
    templateLessons: snapshotLessons(templateGraph.lessons, templateGraph.languages),
    templateExercises: snapshotExercises(templateGraph),
    templateActivities: snapshotActivities(templateGraph),
    courseSections: snapshotSections(courseGraph.sections),
    courseLessons: snapshotLessons(courseGraph.lessons, courseGraph.languages),
    courseExercises: snapshotExercises(courseGraph),
    courseActivities: snapshotActivities(courseGraph)
  });
}

function settingChangesFor(
  template: TCourse,
  course: TCourse,
  syncedAtByKey: Partial<Record<SyncableSettingKey, string>>
) {
  return detectSettingChanges({
    template: toCarrier(template),
    course: toCarrier(course),
    courseCreatedAt: course.createdAt,
    syncedAtByKey
  });
}

export async function getCourseTemplateUpdates(courseId: string, orgId: string) {
  const { course, template, templateOrgId } = await requireLinkedCourse(courseId, orgId);
  const global = Boolean(templateOrgId && templateOrgId !== orgId);
  if (!template || template.status === 'DELETED') {
    return {
      template: template
        ? {
            id: template.id,
            title: template.title,
            deleted: true,
            global,
            bannerImage: template.bannerImage
          }
        : null,
      lastPulledAt: course.createdAt,
      units: [] as DetectedTemplateUnit[],
      settings: [] as DetectedSettingChange[]
    };
  }

  const [templateGraph, courseGraph, syncRows] = await Promise.all([
    loadGraph(template.id, db),
    loadGraph(course.id, db),
    listTemplateSettingSync(course.id)
  ]);
  const syncedAtByKey = Object.fromEntries(syncRows.map((row) => [row.settingKey, row.syncedAt])) as Partial<
    Record<SyncableSettingKey, string>
  >;
  const units = detectFromGraphs(course, templateGraph, courseGraph);
  const settings = settingChangesFor(template, course, syncedAtByKey);
  const lastPulledAt = latestIso([
    course.createdAt,
    ...courseGraph.sections.map((section) => section.sourceSyncedAt),
    ...courseGraph.lessons.map((lesson) => lesson.sourceSyncedAt),
    ...courseGraph.exercises.map((exercise) => exercise.sourceSyncedAt),
    ...courseGraph.activities.map((activity) => activity.sourceSyncedAt),
    ...syncRows.map((row) => row.syncedAt)
  ]);

  return {
    template: {
      id: template.id,
      title: template.title,
      deleted: false,
      global,
      bannerImage: template.bannerImage
    },
    lastPulledAt,
    units,
    settings
  };
}

function copyBySource<T extends { id: string; sourceId: string | null }>(items: T[], sourceId: string) {
  return items.find((item) => item.sourceId === sourceId) ?? null;
}

async function copyExerciseBody(
  templateExerciseId: string,
  courseExerciseId: string,
  templateGraph: SyncGraph,
  templateOrgId: string | null,
  courseOrgId: string | null,
  userId: string,
  client: DbOrTxClient
) {
  await deleteExerciseChildren(courseExerciseId, client);
  const sections = templateGraph.exerciseSections.filter((section) => section.exerciseId === templateExerciseId);
  const remappedSections = await remapContentAssets(sections, templateOrgId, courseOrgId, userId, client);
  const createdSections =
    remappedSections.length > 0
      ? await createExerciseSections(
          remappedSections.map((section) => ({
            title: section.title,
            description: section.description,
            order: section.order,
            colorTheme: section.colorTheme,
            afterBehavior: section.afterBehavior,
            exerciseId: courseExerciseId
          })),
          client
        )
      : [];
  const sectionIds = new Map<string, string>();
  sections.forEach((section, index) => {
    const created = createdSections[index];
    if (created) sectionIds.set(section.id, created.id);
  });

  await Promise.all(
    createdSections.map((section) => {
      const behavior = section.afterBehavior as { action?: string; exerciseSectionId?: string };
      if (behavior.action !== 'go_to_section' || !behavior.exerciseSectionId) return null;

      const remappedId = sectionIds.get(behavior.exerciseSectionId);
      if (!remappedId) return null;

      return updateExerciseSection(
        section.id,
        { afterBehavior: { action: 'go_to_section', exerciseSectionId: remappedId } },
        client
      );
    })
  );

  const questions = templateGraph.questions.filter((question) => question.exerciseId === templateExerciseId);
  const remappedQuestions = await remapContentAssets(questions, templateOrgId, courseOrgId, userId, client);
  const createdQuestions =
    remappedQuestions.length > 0
      ? await createQuestions(
          remappedQuestions.map((question) => ({
            name: question.name,
            title: question.title,
            points: question.points,
            order: question.order,
            questionTypeId: question.questionTypeId,
            settings: question.settings,
            exerciseSectionId: question.exerciseSectionId ? (sectionIds.get(question.exerciseSectionId) ?? null) : null,
            exerciseId: courseExerciseId
          })),
          client
        )
      : [];
  const questionIds = new Map<number, number>();
  questions.forEach((question, index) => {
    const createdId = createdQuestions[index]?.id;
    if (question.id !== undefined && createdId !== undefined) questionIds.set(question.id, createdId);
  });

  const options = templateGraph.options.filter((option) => questionIds.has(option.questionId));
  const remappedOptions = await remapContentAssets(options, templateOrgId, courseOrgId, userId, client);
  const optionsToCreate = remappedOptions
    .map((option) => {
      const questionId = questionIds.get(option.questionId);
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
    await createOptions(optionsToCreate, client);
  }
}

async function writeLessonLanguages(
  templateLessonId: string,
  courseLessonId: string,
  templateGraph: SyncGraph,
  templateOrgId: string | null,
  courseOrgId: string | null,
  userId: string,
  syncedAt: string,
  client: DbOrTxClient
) {
  const templateLanguages = templateGraph.languages.filter((language) => language.lessonId === templateLessonId);
  const courseLanguages = await getLessonLanguagesByLessonIds([courseLessonId], client);

  for (const language of templateLanguages) {
    if (!language.locale) continue;

    const remapped = await remapContentAssets(language, templateOrgId, courseOrgId, userId, client);
    const existing = courseLanguages.find((courseLanguage) => courseLanguage.locale === language.locale);
    const saved = existing
      ? await updateLessonLanguage(
          courseLessonId,
          language.locale,
          { content: remapped.content, updatedAt: syncedAt },
          client
        )
      : await createLessonLanguage(
          { content: remapped.content, locale: language.locale, lessonId: courseLessonId, updatedAt: syncedAt },
          client
        );

    await recordLessonLanguageVersion({
      lessonLanguageId: saved.id,
      content: saved.content,
      authorId: userId,
      intent: 'manual',
      dbClient: client
    });
  }
}

function packageIsNewer(left: string | null | undefined, right: string | null | undefined) {
  if (!left) return false;
  if (!right) return true;

  return Date.parse(left) > Date.parse(right);
}

async function pullActivityDetails(
  templateActivityId: string,
  courseActivityId: string,
  templateOrgId: string | null,
  courseOrgId: string | null,
  userId: string,
  client: DbOrTxClient
) {
  const templateDetails = await getActivityScormByActivityId(templateActivityId, client);
  if (!templateDetails) return;

  const courseDetails = await getActivityScormByActivityId(courseActivityId, client);
  const crossOrg = Boolean(templateOrgId && courseOrgId && templateOrgId !== courseOrgId);

  if (!courseDetails?.assetId && templateDetails.assetId) {
    if (!crossOrg) {
      await upsertActivityScorm(
        {
          activityId: courseActivityId,
          assetId: templateDetails.assetId,
          completionRule: templateDetails.completionRule,
          minScorePercent: templateDetails.minScorePercent,
          allowRetakes: templateDetails.allowRetakes,
          moduleOrder: templateDetails.moduleOrder
        },
        client
      );

      if (courseOrgId) {
        await createAssetUsage(
          {
            organizationId: courseOrgId,
            assetId: templateDetails.assetId,
            targetType: 'activity',
            targetId: courseActivityId,
            slotType: ACTIVITY_PACKAGE_SLOT,
            createdByProfileId: userId
          },
          client
        );
      }

      return;
    }

    const templateAsset = await getAssetById(templateDetails.assetId, templateOrgId ?? undefined);
    if (!templateAsset || !courseOrgId) return;

    const transfer = await transferScormPackageAsset(templateAsset, courseOrgId, userId, client);
    await upsertActivityScorm(
      {
        activityId: courseActivityId,
        assetId: transfer.asset.id,
        completionRule: templateDetails.completionRule,
        minScorePercent: templateDetails.minScorePercent,
        allowRetakes: templateDetails.allowRetakes,
        moduleOrder: templateDetails.moduleOrder
      },
      client
    );
    await createAssetUsage(
      {
        organizationId: courseOrgId,
        assetId: transfer.asset.id,
        targetType: 'activity',
        targetId: courseActivityId,
        slotType: ACTIVITY_PACKAGE_SLOT,
        createdByProfileId: userId
      },
      client
    );

    return;
  }

  await upsertActivityScorm(
    {
      activityId: courseActivityId,
      assetId: courseDetails?.assetId ?? templateDetails.assetId,
      completionRule: templateDetails.completionRule,
      minScorePercent: templateDetails.minScorePercent,
      allowRetakes: templateDetails.allowRetakes,
      moduleOrder: templateDetails.moduleOrder
    },
    client
  );

  if (!crossOrg || !templateDetails.assetId || !courseDetails?.assetId) return;
  if (templateDetails.assetId === courseDetails.assetId || !courseOrgId) return;

  const [templateCurrent, courseCurrent] = await Promise.all([
    getCurrentPackageVersion(templateDetails.assetId, client),
    getCurrentPackageVersion(courseDetails.assetId, client)
  ]);
  if (!templateCurrent || templateCurrent.status !== 'ready') return;
  if (courseCurrent && !packageIsNewer(templateCurrent.updatedAt, courseCurrent.updatedAt)) return;

  const copied = await copyPackageVersionToAsset(
    templateCurrent.id,
    courseDetails.assetId,
    courseOrgId,
    userId,
    client
  );
  await setCurrentPackageVersion(copied.id, client);
}

export async function pullCourseTemplateUpdates(
  courseId: string,
  orgId: string,
  userId: string,
  requestedUnitIds: string[],
  requestedSettingKeys: SyncableSettingKey[]
) {
  const pulled = await withAssetStorageRollback(() =>
    db.transaction(async (tx) => {
      await lockCourseForUpdate(courseId, tx);
      const { course, template, templateOrgId, courseOrgId } = await requireLinkedCourse(courseId, orgId, tx);
      if (!template || template.status === 'DELETED') {
        throw new AppError('Template not found', ErrorCodes.COURSE_NOT_FOUND, 404);
      }

      const templateGraph = await loadGraph(template.id, tx);
      const courseGraph = await loadGraph(course.id, tx);
      const syncRows = await listTemplateSettingSync(course.id, tx);
      const syncedAtByKey = Object.fromEntries(syncRows.map((row) => [row.settingKey, row.syncedAt])) as Partial<
        Record<SyncableSettingKey, string>
      >;
      const units = detectFromGraphs(course, templateGraph, courseGraph);
      const settings = settingChangesFor(template, course, syncedAtByKey);
      const selection = preparePullSelection(units, settings, requestedUnitIds, requestedSettingKeys);
      if (!selection.ok) {
        const message =
          selection.reason === 'locked'
            ? 'An exercise with submissions cannot be updated'
            : selection.reason === 'empty'
              ? 'Choose at least one change'
              : 'Template changes are out of date';
        throw new AppError(
          message,
          selection.reason === 'empty' ? ErrorCodes.VALIDATION_ERROR : ErrorCodes.CONFLICT,
          selection.reason === 'empty' ? 400 : 409
        );
      }

      const selected = new Set(selection.unitIds);
      const syncedAt = new Date().toISOString();
      const crossOrg = Boolean(templateOrgId && courseOrgId && templateOrgId !== courseOrgId);
      const stamped = {
        sectionIds: [] as string[],
        lessonIds: [] as string[],
        exerciseIds: [] as string[],
        activityIds: [] as string[]
      };

      const templateSections = templateGraph.sections.slice().sort((left, right) => left.order - right.order);
      for (const section of templateSections) {
        if (!selected.has(section.id)) continue;

        const existing = copyBySource(courseGraph.sections, section.id);
        if (existing) {
          await updateCourseSection(existing.id, { title: section.title, updatedAt: syncedAt }, tx);
          stamped.sectionIds.push(existing.id);
          continue;
        }

        const order = await claimRootOrder(templateGraph, courseGraph, section.id, course.id, tx);
        const createdSections = await createCourseSections(
          [{ title: section.title, order, courseId: course.id, sourceId: section.id, sourceSyncedAt: syncedAt }],
          tx
        );
        const created = createdSections[0];
        if (!created) throw new AppError('Failed to pull section', ErrorCodes.INTERNAL_ERROR, 500);

        courseGraph.sections.push(created);
        stamped.sectionIds.push(created.id);
      }

      const templateLessons = templateGraph.lessons.slice().sort((left, right) => left.order - right.order);
      for (const lesson of templateLessons) {
        if (!selected.has(lesson.id)) continue;

        const existing = copyBySource(courseGraph.lessons, lesson.id);
        const remapped = await remapContentAssets(lesson, templateOrgId, courseOrgId, userId, tx);
        if (existing) {
          await updateLesson(
            existing.id,
            {
              note: remapped.note,
              videoUrl: remapped.videoUrl,
              slideUrl: remapped.slideUrl,
              slides: remapped.slides,
              title: remapped.title,
              public: remapped.public,
              lessonAt: remapped.lessonAt,
              teacherId: crossOrg ? null : remapped.teacherId,
              callUrl: crossOrg ? null : remapped.callUrl,
              sessionDurationMinutes: remapped.sessionDurationMinutes,
              recordingUrl: crossOrg ? null : remapped.recordingUrl,
              isUnlocked: remapped.isUnlocked,
              completionPolicy: remapped.completionPolicy,
              videoWatchThreshold: remapped.videoWatchThreshold,
              commentsEnabled: remapped.commentsEnabled,
              videos: remapped.videos,
              documents: remapped.documents,
              slug: remapped.slug,
              updatedAt: syncedAt
            },
            tx
          );
          await syncLessonAssetUsages(
            [{ id: existing.id, videos: remapped.videos, documents: remapped.documents }],
            courseOrgId,
            userId,
            tx
          );
          await writeLessonLanguages(
            lesson.id,
            existing.id,
            templateGraph,
            templateOrgId,
            courseOrgId,
            userId,
            syncedAt,
            tx
          );
          stamped.lessonIds.push(existing.id);
          continue;
        }

        const parentId = lesson.sectionId ? (copyBySource(courseGraph.sections, lesson.sectionId)?.id ?? null) : null;
        if (lesson.sectionId && !parentId) {
          throw new AppError('Template changes are out of date', ErrorCodes.CONFLICT, 409);
        }

        const order = parentId
          ? await claimSectionLessonOrder(templateLessons, courseGraph, lesson, parentId, course.id, tx)
          : await claimRootOrder(templateGraph, courseGraph, lesson.id, course.id, tx);
        const createdLessons = await createLessons(
          [
            {
              note: remapped.note,
              videoUrl: remapped.videoUrl,
              slideUrl: remapped.slideUrl,
              slides: remapped.slides,
              courseId: course.id,
              title: remapped.title,
              public: remapped.public,
              lessonAt: remapped.lessonAt,
              teacherId: crossOrg ? null : remapped.teacherId,
              isComplete: false,
              callUrl: crossOrg ? null : remapped.callUrl,
              sessionDurationMinutes: remapped.sessionDurationMinutes,
              recordingUrl: crossOrg ? null : remapped.recordingUrl,
              order,
              isUnlocked: remapped.isUnlocked,
              completionPolicy: remapped.completionPolicy,
              videoWatchThreshold: remapped.videoWatchThreshold,
              commentsEnabled: remapped.commentsEnabled,
              videos: remapped.videos,
              documents: remapped.documents,
              sectionId: parentId,
              slug: remapped.slug,
              sourceId: lesson.id,
              sourceSyncedAt: syncedAt
            }
          ],
          tx
        );
        const created = createdLessons[0];
        if (!created) throw new AppError('Failed to pull lesson', ErrorCodes.INTERNAL_ERROR, 500);

        courseGraph.lessons.push(created);
        await syncLessonAssetUsages([created], courseOrgId, userId, tx);
        await writeLessonLanguages(
          lesson.id,
          created.id,
          templateGraph,
          templateOrgId,
          courseOrgId,
          userId,
          syncedAt,
          tx
        );
        stamped.lessonIds.push(created.id);
      }

      const templateExercises = templateGraph.exercises.slice().sort((left, right) => left.order - right.order);
      for (const exercise of templateExercises) {
        if (!selected.has(exercise.id)) continue;

        const existing = copyBySource(courseGraph.exercises, exercise.id);
        const remapped = await remapContentAssets(exercise, templateOrgId, courseOrgId, userId, tx);
        if (existing) {
          await updateExercise(
            existing.id,
            {
              title: remapped.title,
              description: remapped.description,
              dueBy: remapped.dueBy,
              sectionDisplayMode: remapped.sectionDisplayMode,
              isUnlocked: remapped.isUnlocked,
              allowMultipleAttempts: remapped.allowMultipleAttempts,
              completionPolicy: remapped.completionPolicy,
              passThreshold: remapped.passThreshold,
              slug: remapped.slug,
              updatedAt: syncedAt
            },
            tx
          );
          await copyExerciseBody(exercise.id, existing.id, templateGraph, templateOrgId, courseOrgId, userId, tx);
          stamped.exerciseIds.push(existing.id);
          continue;
        }

        const parentSectionId = exercise.sectionId
          ? (copyBySource(courseGraph.sections, exercise.sectionId)?.id ?? null)
          : null;
        const parentLessonId = exercise.lessonId
          ? (copyBySource(courseGraph.lessons, exercise.lessonId)?.id ?? null)
          : null;
        if ((exercise.sectionId && !parentSectionId) || (exercise.lessonId && !parentLessonId)) {
          throw new AppError('Template changes are out of date', ErrorCodes.CONFLICT, 409);
        }

        const order =
          parentSectionId || parentLessonId
            ? await claimNestedExerciseOrder(
                templateExercises,
                courseGraph,
                exercise,
                { sectionId: parentSectionId, lessonId: parentLessonId },
                course.id,
                tx
              )
            : await claimRootOrder(templateGraph, courseGraph, exercise.id, course.id, tx);
        const createdExercises = await createExercises(
          [
            {
              title: remapped.title,
              description: remapped.description,
              dueBy: remapped.dueBy,
              lessonId: parentLessonId,
              courseId: course.id,
              sectionId: parentSectionId,
              sectionDisplayMode: remapped.sectionDisplayMode,
              order,
              isUnlocked: remapped.isUnlocked,
              allowMultipleAttempts: remapped.allowMultipleAttempts,
              completionPolicy: remapped.completionPolicy,
              passThreshold: remapped.passThreshold,
              slug: remapped.slug,
              sourceId: exercise.id,
              sourceSyncedAt: syncedAt
            }
          ],
          tx
        );
        const created = createdExercises[0];
        if (!created) throw new AppError('Failed to pull exercise', ErrorCodes.INTERNAL_ERROR, 500);

        courseGraph.exercises.push(created);
        await copyExerciseBody(exercise.id, created.id, templateGraph, templateOrgId, courseOrgId, userId, tx);
        stamped.exerciseIds.push(created.id);
      }

      const templateActivities = templateGraph.activities.slice().sort((left, right) => left.order - right.order);
      for (const activity of templateActivities) {
        if (!selected.has(activity.id)) continue;

        const existing = copyBySource(courseGraph.activities, activity.id);
        if (existing) {
          await updateActivity(
            existing.id,
            {
              title: activity.title,
              instructions: activity.instructions,
              isUnlocked: activity.isUnlocked,
              slug: activity.slug
            },
            tx
          );
          await pullActivityDetails(activity.id, existing.id, templateOrgId, courseOrgId, userId, tx);
          stamped.activityIds.push(existing.id);
          continue;
        }

        const parentId = activity.sectionId
          ? (copyBySource(courseGraph.sections, activity.sectionId)?.id ?? null)
          : null;
        if (activity.sectionId && !parentId) {
          throw new AppError('Template changes are out of date', ErrorCodes.CONFLICT, 409);
        }

        const order = parentId
          ? await claimSectionActivityOrder(templateActivities, courseGraph, activity, parentId, course.id, tx)
          : await claimRootOrder(templateGraph, courseGraph, activity.id, course.id, tx);
        const createdActivities = await createActivities(
          [
            {
              kind: activity.kind,
              title: activity.title,
              instructions: activity.instructions,
              slug: activity.slug,
              order,
              isUnlocked: activity.isUnlocked,
              courseId: course.id,
              sectionId: parentId,
              sourceId: activity.id,
              sourceSyncedAt: syncedAt,
              createdByProfileId: userId
            }
          ],
          tx
        );
        const created = createdActivities[0];
        if (!created) throw new AppError('Failed to pull activity', ErrorCodes.INTERNAL_ERROR, 500);

        const provider = ACTIVITY_PROVIDERS[activity.kind as TActivityKind];
        if (!provider) {
          throw new AppError(`Unknown activity kind "${activity.kind}"`, ErrorCodes.VALIDATION_ERROR, 400);
        }

        await provider.copy(
          { activityId: activity.id, organizationId: templateOrgId },
          { activityId: created.id, organizationId: courseOrgId, userId },
          tx
        );
        courseGraph.activities.push(created);
        stamped.activityIds.push(created.id);
      }

      if (selection.settingKeys.length > 0) {
        const patch = applySettingChanges(toCarrier(course), toCarrier(template), selection.settingKeys);
        const remappedPatch = await remapContentAssets(patch, templateOrgId, courseOrgId, userId, tx);
        await updateCourse(course.id, remappedPatch as Partial<TCourse>, tx);
        await upsertTemplateSettingSync(course.id, selection.settingKeys, syncedAt, tx);
      }

      await stampCopiedTemplateUnits({ ...stamped, syncedAt }, tx);

      return {
        unitIds: selection.unitIds,
        settingKeys: selection.settingKeys
      };
    })
  );

  await invalidateOrgStats(orgId);
  return pulled;
}
