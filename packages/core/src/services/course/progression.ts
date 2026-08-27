import { ContentType, ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import {
  computeProgressionAccess,
  flattenNavigableItems,
  type ProgressionLockReason
} from '@cio/utils/functions/course-progression';
import type { CourseContentItemRow } from '@cio/db/queries/course/content';
import {
  getCompletedExerciseIdsForMember,
  getCompletedLessonIdsForProfile,
  getExerciseProgressionPolicies,
  getLessonProgressionPolicies,
  type ExerciseProgressionPolicy,
  type LessonProgressionPolicy
} from '@cio/db/queries/course/progression';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';

import { buildCourseContent, type CourseContent, type CourseContentItem } from './utils';

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

function annotateNavigableAccess(params: {
  navigableItems: CourseContentItem[];
  lessonPolicyById: Map<string, LessonProgressionPolicy>;
  progressionMode: 'free' | 'sequential';
  completedLessonIds: Set<string>;
  completedExerciseIds: Set<string>;
}): Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }> {
  return computeProgressionAccess({
    navigableItems: params.navigableItems,
    progressionMode: params.progressionMode,
    isComplete: (item) => {
      if (item.type === ContentType.Lesson) {
        return params.completedLessonIds.has(item.id);
      }

      if (item.type === ContentType.Exercise) {
        return params.completedExerciseIds.has(item.id) || Boolean(item.isComplete);
      }

      return true;
    },
    getCompletionPolicy: (item) => {
      const lessonPolicy = params.lessonPolicyById.get(item.id);
      return lessonPolicy?.completionPolicy ?? 'manual';
    }
  });
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

  const [lessonPolicies, exercisePolicies, completedLessonIds, completedExerciseIds] = await Promise.all([
    getLessonProgressionPolicies(params.courseId),
    getExerciseProgressionPolicies(params.courseId),
    getCompletedLessonIdsForProfile(params.courseId, params.profileId),
    groupMemberId
      ? getCompletedExerciseIdsForMember(params.courseId, groupMemberId)
      : Promise.resolve(new Set<string>())
  ]);

  const lessonPolicyById = new Map(lessonPolicies.map((policy) => [policy.id, policy]));
  const exercisePolicyById = new Map(exercisePolicies.map((policy) => [policy.id, policy]));

  const accessById = annotateNavigableAccess({
    navigableItems: flattenNavigableItems(content),
    lessonPolicyById,
    progressionMode,
    completedLessonIds,
    completedExerciseIds
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
