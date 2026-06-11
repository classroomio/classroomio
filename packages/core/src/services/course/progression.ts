import { ContentType } from '@cio/utils/constants';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { CourseContentItemRow } from '@cio/db/queries/course/content';
import {
  getCompletedLessonIdsForProfile,
  getExerciseProgressionPolicies,
  getLessonProgressionPolicies,
  getPassedExerciseIdsForMember,
  getSubmittedExerciseIdsForMember,
  type ExerciseProgressionPolicy,
  type LessonProgressionPolicy
} from '@cio/db/queries/course/progression';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';

import { buildCourseContent, type CourseContent, type CourseContentItem } from './utils';

export type ProgressionLockReason = 'teacher_locked' | 'progression_blocked';

export type AnnotatedCourseContentItem = CourseContentItem & {
  accessible?: boolean;
  lockReason?: ProgressionLockReason | null;
  completionPolicy?: string | null;
  videoWatchThreshold?: number | null;
  passThreshold?: number | null;
};

export type AnnotatedCourseContent = {
  grouped: boolean;
  sections: Array<{
    id: string;
    title: string;
    order: number | null;
    items: AnnotatedCourseContentItem[];
  }>;
  items: AnnotatedCourseContentItem[];
};

function sortNavigableItems(items: CourseContentItem[]): CourseContentItem[] {
  return [...items].sort((left, right) => {
    const orderDiff = (left.order ?? 0) - (right.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    const typeDiff = (left.type === ContentType.Lesson ? 0 : 1) - (right.type === ContentType.Lesson ? 0 : 1);
    if (typeDiff !== 0) return typeDiff;

    return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
  });
}

function flattenNavigableItems(content: CourseContent): CourseContentItem[] {
  const items = content.grouped ? content.sections.flatMap((section) => section.items) : content.items;

  return sortNavigableItems(
    items.filter((item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise)
  );
}

function lessonBlocksProgression(policy: string | undefined): boolean {
  return policy !== 'none';
}

function exerciseBlocksProgression(): boolean {
  return true;
}

function isItemProgressComplete(params: {
  item: CourseContentItem;
  lessonPolicy?: LessonProgressionPolicy;
  exercisePolicy?: ExerciseProgressionPolicy;
  completedLessonIds: Set<string>;
  submittedExerciseIds: Set<string>;
  passedExerciseIds: Set<string>;
}): boolean {
  const { item, lessonPolicy, exercisePolicy, completedLessonIds, submittedExerciseIds, passedExerciseIds } = params;

  if (item.type === ContentType.Lesson) {
    return completedLessonIds.has(item.id);
  }

  if (item.type === ContentType.Exercise) {
    const policy = exercisePolicy?.completionPolicy ?? 'submitted';
    if (policy === 'passed') {
      return passedExerciseIds.has(item.id);
    }

    return submittedExerciseIds.has(item.id) || Boolean(item.isComplete);
  }

  return true;
}

function annotateNavigableAccess(params: {
  navigableItems: CourseContentItem[];
  lessonPolicyById: Map<string, LessonProgressionPolicy>;
  exercisePolicyById: Map<string, ExerciseProgressionPolicy>;
  progressionMode: 'free' | 'sequential';
  completedLessonIds: Set<string>;
  submittedExerciseIds: Set<string>;
  passedExerciseIds: Set<string>;
}): Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }> {
  const accessById = new Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>();
  let priorBlockingComplete = true;

  for (const item of params.navigableItems) {
    const lessonPolicy = params.lessonPolicyById.get(item.id);
    const exercisePolicy = params.exercisePolicyById.get(item.id);
    const teacherLocked = !(item.isUnlocked ?? false);
    const progressionLocked = params.progressionMode === 'sequential' && !priorBlockingComplete;

    let accessible = !teacherLocked && !progressionLocked;
    let lockReason: ProgressionLockReason | null = null;

    if (teacherLocked) {
      accessible = false;
      lockReason = 'teacher_locked';
    } else if (progressionLocked) {
      accessible = false;
      lockReason = 'progression_blocked';
    }

    accessById.set(item.id, { accessible, lockReason });

    const complete = isItemProgressComplete({
      item,
      lessonPolicy,
      exercisePolicy,
      completedLessonIds: params.completedLessonIds,
      submittedExerciseIds: params.submittedExerciseIds,
      passedExerciseIds: params.passedExerciseIds
    });

    const blocks =
      item.type === ContentType.Lesson
        ? lessonBlocksProgression(lessonPolicy?.completionPolicy ?? 'manual')
        : exerciseBlocksProgression();

    if (blocks && !complete) {
      priorBlockingComplete = false;
    }
  }

  return accessById;
}

function applyAccessToContent(
  content: CourseContent,
  accessById: Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>,
  lessonPolicyById: Map<string, LessonProgressionPolicy>,
  exercisePolicyById: Map<string, ExerciseProgressionPolicy>
): AnnotatedCourseContent {
  const annotateItem = (item: CourseContentItem): AnnotatedCourseContentItem => {
    const access = accessById.get(item.id);
    const lessonPolicy = lessonPolicyById.get(item.id);
    const exercisePolicy = exercisePolicyById.get(item.id);

    return {
      ...item,
      accessible: access?.accessible ?? true,
      lockReason: access?.lockReason ?? null,
      completionPolicy: lessonPolicy?.completionPolicy ?? exercisePolicy?.completionPolicy ?? null,
      videoWatchThreshold: lessonPolicy?.videoWatchThreshold ?? null,
      passThreshold: exercisePolicy?.passThreshold ?? null
    };
  };

  if (!content.grouped) {
    return {
      grouped: false,
      sections: [],
      items: content.items.map(annotateItem)
    };
  }

  return {
    grouped: true,
    sections: content.sections.map((section) => ({
      ...section,
      items: section.items.map(annotateItem)
    })),
    items: []
  };
}

export async function annotateCourseContentWithProgression(params: {
  courseId: string;
  profileId: string;
  roleId: number | null;
  progressionMode?: 'free' | 'sequential';
  contentRows: CourseContentItemRow[];
  isContentGroupingEnabled: boolean;
}): Promise<AnnotatedCourseContent> {
  const content = buildCourseContent(params.contentRows, params.isContentGroupingEnabled);

  if (params.roleId !== ROLE.STUDENT) {
    const [lessonPolicies, exercisePolicies] = await Promise.all([
      getLessonProgressionPolicies(params.courseId),
      getExerciseProgressionPolicies(params.courseId)
    ]);

    const lessonPolicyById = new Map(lessonPolicies.map((policy) => [policy.id, policy]));
    const exercisePolicyById = new Map(exercisePolicies.map((policy) => [policy.id, policy]));
    const accessById = new Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>();

    for (const item of flattenNavigableItems(content)) {
      accessById.set(item.id, { accessible: true, lockReason: null });
    }

    return applyAccessToContent(content, accessById, lessonPolicyById, exercisePolicyById);
  }

  const progressionMode = params.progressionMode ?? 'free';
  const groupMemberId = await getGroupMemberIdByCourseAndProfile(params.courseId, params.profileId);

  const [lessonPolicies, exercisePolicies, completedLessonIds, submittedExerciseIds] = await Promise.all([
    getLessonProgressionPolicies(params.courseId),
    getExerciseProgressionPolicies(params.courseId),
    getCompletedLessonIdsForProfile(params.courseId, params.profileId),
    groupMemberId
      ? getSubmittedExerciseIdsForMember(params.courseId, groupMemberId)
      : Promise.resolve(new Set<string>())
  ]);

  const passedExerciseIds = groupMemberId
    ? await getPassedExerciseIdsForMember(params.courseId, groupMemberId, exercisePolicies)
    : new Set<string>();

  const lessonPolicyById = new Map(lessonPolicies.map((policy) => [policy.id, policy]));
  const exercisePolicyById = new Map(exercisePolicies.map((policy) => [policy.id, policy]));

  const accessById = annotateNavigableAccess({
    navigableItems: flattenNavigableItems(content),
    lessonPolicyById,
    exercisePolicyById,
    progressionMode,
    completedLessonIds,
    submittedExerciseIds,
    passedExerciseIds
  });

  return applyAccessToContent(content, accessById, lessonPolicyById, exercisePolicyById);
}

export async function assertStudentCanAccessContent(params: {
  courseId: string;
  profileId: string;
  roleId: number | null;
  contentId: string;
  type: ContentType.Lesson | ContentType.Exercise;
  progressionMode?: 'free' | 'sequential';
  contentRows: CourseContentItemRow[];
  isContentGroupingEnabled: boolean;
}): Promise<void> {
  if (params.roleId !== ROLE.STUDENT) {
    return;
  }

  const annotated = await annotateCourseContentWithProgression({
    courseId: params.courseId,
    profileId: params.profileId,
    roleId: params.roleId,
    progressionMode: params.progressionMode,
    contentRows: params.contentRows,
    isContentGroupingEnabled: params.isContentGroupingEnabled
  });

  const items = annotated.grouped ? annotated.sections.flatMap((section) => section.items) : annotated.items;
  const target = items.find((item) => item.id === params.contentId && item.type === params.type);

  if (!target) {
    throw new AppError('Content not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (target.accessible === false) {
    throw new AppError('Content is locked', ErrorCodes.VALIDATION_ERROR, 403);
  }
}
