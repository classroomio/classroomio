import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { db } from '@cio/db/drizzle';
import {
  countActivitiesInCourse,
  createActivities,
  deleteActivity,
  deleteActivityCompletions,
  getActivitiesByCourseId,
  getActivityById,
  markActivityCompleteOnce,
  updateActivity
} from '@cio/db/queries/activity';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { getCourseById, getCourseSectionById } from '@cio/db/queries/course/course';
import type { TCourseActivity } from '@cio/db/types';
import type { TActivityKind } from '@cio/utils/constants/activity';
import type { TActivityCreate, TActivityUpdate } from '@cio/utils/validation/activity';
import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';
import { getActivityScormByActivityId } from '@cio/db/queries/scorm/activity-scorm';
import { sanitizeHtml } from '../../utils/sanitize-html';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import { ACTIVITY_PROVIDERS } from './providers';
import type {
  ActivityEditorData,
  ActivityLearnerDetail,
  ActivityLearnerSummary,
  ActivityResultsSummary
} from './providers';
import { assertCourseAllowsActivities } from '../course/public-course-guard';
import { ContentType } from '@cio/utils/constants';
import { assertCourseAcceptsContent } from '../course/content';
import { resolveItemSlug } from '../course/slug';

async function nextActivityOrder(courseId: string, sectionId: string | null): Promise<number> {
  const items = await getCourseContentItems(courseId);

  const orders = items
    .filter((item) => (item.sectionId ?? null) === (sectionId ?? null))
    .map((item) => item.order ?? 0);

  return orders.length === 0 ? 1 : Math.max(...orders) + 1;
}

/**
 * Creates an activity of a kind in a section. Throws when the course is PUBLIC.
 */
export async function createActivity(
  courseId: string,
  input: TActivityCreate,
  profileId?: string
): Promise<TCourseActivity> {
  await assertCourseAllowsActivities(courseId);
  await assertCourseAcceptsContent(courseId, ContentType.Activity);

  if (input.sectionId) {
    const section = await getCourseSectionById(input.sectionId);
    if (!section || section.courseId !== courseId) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }
  }

  const title = input.title ?? '';
  const slug = await resolveItemSlug({ courseId, title });
  const order = await nextActivityOrder(courseId, input.sectionId ?? null);

  return db.transaction(async (tx) => {
    const [activity] = await createActivities(
      [
        {
          courseId,
          sectionId: input.sectionId ?? null,
          kind: input.kind,
          title,
          slug,
          order,
          createdByProfileId: profileId ?? null
        }
      ],
      tx
    );
    if (!activity) {
      throw new AppError('Failed to create activity', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const provider = ACTIVITY_PROVIDERS[input.kind as TActivityKind];
    if (provider) {
      await provider.createDetails(activity.id, {}, tx);
    }

    return activity;
  });
}

/**
 * Returns an activity when it belongs to the course. Throws otherwise.
 */
export async function getActivity(courseId: string, activityId: string): Promise<TCourseActivity> {
  const activity = await getActivityById(activityId);
  if (!activity || activity.courseId !== courseId) {
    throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);
  }

  return activity;
}

/**
 * Returns an activity with its kind editor data. Throws when the activity is
 * not in the course.
 */
export async function getActivityWithEditorData(
  courseId: string,
  activityId: string
): Promise<{ activity: TCourseActivity; editor: ActivityEditorData }> {
  const activity = await getActivity(courseId, activityId);
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];
  if (!provider) throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);

  const editor = await provider.getEditorData(activityId);
  const sanitizedInstructions = activity.instructions ? sanitizeHtml(activity.instructions) : activity.instructions;

  return { activity: { ...activity, instructions: sanitizedInstructions }, editor };
}

/**
 * Returns only the public fields a learner needs: sanitized instructions and
 * the retake flag. Never exposes package versions, hashes or learner counts.
 */
export async function getActivityForStudent(
  courseId: string,
  activityId: string
): Promise<{ activity: TCourseActivity; editor: ActivityEditorData }> {
  const activity = await getActivity(courseId, activityId);
  const details = await getActivityScormByActivityId(activityId);
  const settings = ZScormSettings.parse({
    completionRule: details?.completionRule ?? 'auto',
    minScorePercent: details?.minScorePercent ?? null,
    allowRetakes: details?.allowRetakes ?? false,
    moduleOrder: details?.moduleOrder ?? 'free',
    completionModules: details?.completionModules ?? 'all'
  });
  const sanitizedInstructions = activity.instructions ? sanitizeHtml(activity.instructions) : activity.instructions;

  return {
    activity: { ...activity, instructions: sanitizedInstructions },
    editor: { available: true, kind: 'scorm', settings, package: null }
  };
}

/**
 * Validates and saves kind settings for an activity.
 */
export async function updateActivitySettings(courseId: string, activityId: string, input: unknown): Promise<void> {
  const activity = await getActivity(courseId, activityId);
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];
  if (!provider) throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);

  await db.transaction(async (tx) => {
    await provider.updateSettings(activityId, input, tx);
  });
}

/**
 * Resolves what a launch opens through the activity's provider. Never writes
 * completion. Throws when the activity is not in the course.
 */
export async function launchActivity(
  courseId: string,
  activityId: string,
  input: { unitIdentifier?: string; newAttempt?: boolean },
  context: { profileId: string; organizationId: string; isPreview: boolean }
) {
  const activity = await getActivity(courseId, activityId);
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];
  if (!provider) throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);

  return provider.launch({
    activityId,
    courseId,
    profileId: context.profileId,
    organizationId: context.organizationId,
    unitIdentifier: input.unitIdentifier,
    newAttempt: input.newAttempt,
    isPreview: context.isPreview
  });
}

/**
 * Returns the learner's module menu through the activity's provider without
 * opening or writing anything. Throws when the activity is not in the course.
 */
export async function getActivityProgress(
  courseId: string,
  activityId: string,
  context: { profileId: string; isPreview: boolean }
) {
  const activity = await getActivity(courseId, activityId);
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];
  if (!provider) throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);

  const units = await provider.progress({ activityId, profileId: context.profileId, isPreview: context.isPreview });

  return { units };
}

/**
 * Updates title, instructions or lock. Throws when the activity is missing.
 */
export async function updateActivityService(
  courseId: string,
  activityId: string,
  input: TActivityUpdate
): Promise<TCourseActivity> {
  await getActivity(courseId, activityId);
  const sanitizedInstructions =
    input.instructions !== undefined && input.instructions !== null
      ? sanitizeHtml(input.instructions)
      : input.instructions;

  const updated = await updateActivity(activityId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.instructions !== undefined ? { instructions: sanitizedInstructions } : {}),
    ...(input.isUnlocked !== undefined ? { isUnlocked: input.isUnlocked } : {})
  });
  if (!updated) {
    throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);
  }

  return updated;
}

/**
 * Removes an activity and its kind rows. Throws when the activity is missing.
 */
export async function deleteActivityService(courseId: string, activityId: string): Promise<TCourseActivity> {
  const activity = await getActivity(courseId, activityId);
  const [course] = await getCourseById(courseId);
  if (course?.format === 'single_activity') {
    throw new AppError(
      'The package in a single-activity course cannot be deleted. Replace the package or convert to a standard course.',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  return db.transaction(async (tx) => {
    const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
      activity.kind as TActivityKind
    ];
    if (provider) {
      await provider.delete(activityId, tx);
    }

    const deleted = await deleteActivity(activityId, tx);
    if (!deleted) {
      throw new AppError('Activity not found', ErrorCodes.ACTIVITY_NOT_FOUND, 404);
    }

    return deleted;
  });
}

export async function countCourseActivities(courseId: string): Promise<number> {
  return countActivitiesInCourse(courseId);
}

/**
 * Clears one learner's attempts and completion for one activity in a single
 * transaction. Throws when the activity is missing or belongs elsewhere.
 */
export async function resetActivityLearner(
  courseId: string,
  activityId: string,
  profileId: string
): Promise<{ attempts: number; completions: number }> {
  const activity = await getActivity(courseId, activityId);
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];

  return db.transaction(async (tx) => {
    const attempts = provider ? await provider.resetLearner([activityId], profileId, tx) : 0;
    const completions = await deleteActivityCompletions([activityId], profileId, tx);

    return { attempts, completions };
  });
}

function providerFor(activity: TCourseActivity) {
  const provider = (ACTIVITY_PROVIDERS as Partial<Record<TActivityKind, (typeof ACTIVITY_PROVIDERS)[TActivityKind]>>)[
    activity.kind as TActivityKind
  ];
  if (!provider) throw new AppError('Activity kind is not supported yet', ErrorCodes.VALIDATION_ERROR, 400);

  return provider;
}

/**
 * Paged learner results with the summary header for the Results tab.
 */
export async function getActivityResults(
  courseId: string,
  activityId: string,
  studentProfileIds: string[],
  paging: TScormResultsQuery
): Promise<{ summary: ActivityResultsSummary; learners: ActivityLearnerSummary[]; total: number }> {
  const activity = await getActivity(courseId, activityId);
  const provider = providerFor(activity);
  const { learners, summary, total } = await provider.listLearnerSummaries(activityId, studentProfileIds, paging);

  return { summary, learners, total };
}

/**
 * Every attempt of one learner for the student sheet.
 */
export async function getActivityLearnerResult(
  courseId: string,
  activityId: string,
  profileId: string
): Promise<ActivityLearnerDetail> {
  const activity = await getActivity(courseId, activityId);

  return providerFor(activity).getLearnerDetail(activityId, profileId);
}

export async function listCourseActivities(courseId: string): Promise<TCourseActivity[]> {
  return getActivitiesByCourseId(courseId);
}

/**
 * Records an activity completion once. Returns true when the row flipped
 * from incomplete to complete. Runs in the caller's transaction when given
 * one, otherwise in its own.
 */
export async function completeActivityOnce(
  activityId: string,
  profileId: string,
  dbClient?: DbOrTxClient
): Promise<boolean> {
  if (dbClient) {
    return markActivityCompleteOnce(activityId, profileId, dbClient);
  }

  return db.transaction((tx) => markActivityCompleteOnce(activityId, profileId, tx));
}
