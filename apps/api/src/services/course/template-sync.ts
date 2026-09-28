import type { TCourse, TCourseSection, TExercise, TLesson, TLessonLanguage } from '@db/types';
import type { DbOrTxClient } from '@db/drizzle';
import { db } from '@db/drizzle';
import {
  countSubmissionsByExerciseIds,
  createCourseSections,
  createExerciseSections,
  createExercises,
  createLessonLanguage,
  createLessons,
  createOptions,
  createQuestions,
  deleteExerciseChildren,
  getCourseById,
  getCourseOrganizationId,
  getCourseSectionsByCourseId,
  getExerciseSectionsByExerciseIds,
  getExercisesByCourseId,
  getLessonLanguagesByLessonIds,
  getLessonsByCourseId,
  getOptionsByQuestionIds,
  getQuestionsByExerciseIds,
  listTemplateSettingSync,
  shiftCourseSectionOrders,
  shiftExerciseOrders,
  shiftLessonOrders,
  stampCopiedTemplateUnits,
  updateCourse,
  updateCourseSection,
  updateExercise,
  updateExerciseSection,
  updateLesson,
  updateLessonLanguage,
  upsertTemplateSettingSync,
  canReadLinkedTemplate,
  lockCourseForUpdate
} from '@db/queries';
import { env } from '@cio/core/config/env';
import { recordLessonLanguageVersion } from '@cio/core/services/lesson-version';
import { withAssetStorageRollback } from '@cio/core/services/assets/asset-transfer';
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

async function loadGraph(courseId: string, client: DbOrTxClient): Promise<SyncGraph> {
  const sections = await getCourseSectionsByCourseId(courseId, client);
  const lessons = await getLessonsByCourseId(courseId, client);
  const exercises = await getExercisesByCourseId(courseId, {}, client);
  const lessonIds = lessons.map((lesson) => lesson.id);
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const languages = lessonIds.length > 0 ? await getLessonLanguagesByLessonIds(lessonIds, client) : [];
  const exerciseSections = await getExerciseSectionsByExerciseIds(exerciseIds, client);
  const questions = await getQuestionsByExerciseIds(exerciseIds, client);
  const questionIds = questions.map((question) => question.id).filter((id): id is number => id !== undefined);
  const options = questionIds.length > 0 ? await getOptionsByQuestionIds(questionIds, client) : [];
  const submissionCounts = await countSubmissionsByExerciseIds(exerciseIds, client);

  return { sections, lessons, languages, exercises, exerciseSections, questions, options, submissionCounts };
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

function exerciseCopyMap(exercises: TExercise[]) {
  const copies = new Map<string, string>();
  for (const exercise of exercises) {
    if (exercise.sourceId) copies.set(exercise.sourceId, exercise.id);
  }

  return copies;
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
    courseSections: snapshotSections(courseGraph.sections),
    courseLessons: snapshotLessons(courseGraph.lessons, courseGraph.languages),
    courseExercises: snapshotExercises(courseGraph)
  });
}

function settingChangesFor(
  template: TCourse,
  course: TCourse,
  courseGraph: SyncGraph,
  syncedAtByKey: Partial<Record<SyncableSettingKey, string>>
) {
  return detectSettingChanges({
    template: toCarrier(template),
    course: toCarrier(course),
    courseCreatedAt: course.createdAt,
    syncedAtByKey,
    exerciseCopyBySourceId: exerciseCopyMap(courseGraph.exercises)
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
  const settings = settingChangesFor(template, course, courseGraph, syncedAtByKey);
  const lastPulledAt = latestIso([
    course.createdAt,
    ...courseGraph.sections.map((section) => section.sourceSyncedAt),
    ...courseGraph.lessons.map((lesson) => lesson.sourceSyncedAt),
    ...courseGraph.exercises.map((exercise) => exercise.sourceSyncedAt),
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
      const settings = settingChangesFor(template, course, courseGraph, syncedAtByKey);
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
      const stamped = { sectionIds: [] as string[], lessonIds: [] as string[], exerciseIds: [] as string[] };

      const templateSections = templateGraph.sections.slice().sort((left, right) => left.order - right.order);
      for (const section of templateSections) {
        if (!selected.has(section.id)) continue;

        const existing = copyBySource(courseGraph.sections, section.id);
        if (existing) {
          await updateCourseSection(existing.id, { title: section.title, updatedAt: syncedAt }, tx);
          stamped.sectionIds.push(existing.id);
          continue;
        }

        const order = insertionOrder(
          templateSections,
          section.id,
          sourceOrders(courseGraph.sections),
          courseGraph.sections
        );
        await shiftCourseSectionOrders(course.id, order, tx);
        bumpOrders(courseGraph.sections, order);
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

        const templateSiblings = templateLessons.filter((sibling) => sibling.sectionId === lesson.sectionId);
        const placed = courseGraph.lessons.filter((sibling) => (sibling.sectionId ?? null) === parentId);
        const order = insertionOrder(templateSiblings, lesson.id, sourceOrders(placed), placed);
        await shiftLessonOrders(course.id, parentId, order, tx);
        bumpOrders(placed, order);
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

        const templateSiblings = templateExercises.filter((sibling) =>
          exercise.sectionId
            ? sibling.sectionId === exercise.sectionId
            : sibling.lessonId === exercise.lessonId && !sibling.sectionId
        );
        const placed = courseGraph.exercises.filter((sibling) =>
          parentSectionId
            ? sibling.sectionId === parentSectionId
            : parentLessonId
              ? sibling.lessonId === parentLessonId && !sibling.sectionId
              : !sibling.sectionId && !sibling.lessonId
        );
        const order = insertionOrder(templateSiblings, exercise.id, sourceOrders(placed), placed);
        await shiftExerciseOrders(
          course.id,
          { sectionId: parentSectionId, lessonId: parentSectionId ? null : parentLessonId },
          order,
          tx
        );
        bumpOrders(placed, order);
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

      if (selection.settingKeys.length > 0) {
        const patch = applySettingChanges(
          toCarrier(course),
          toCarrier(template),
          selection.settingKeys,
          exerciseCopyMap(courseGraph.exercises)
        );
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
