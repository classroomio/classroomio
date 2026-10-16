import { ROLE } from '@cio/utils/constants';
import { ContentType } from '@cio/utils/constants/content';
import { getLastSeenForUserIds } from '@cio/db/queries/analytics';
import { getCourseById } from '@cio/db/queries/course/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import {
  getBatchActivityCompletionsForCourse,
  getBatchCompletedExerciseIdsForMembers,
  getBatchLessonCompletionsForCourse,
  getBatchStudentCourseMembership,
  getCourseTrackableContentCounts
} from '@cio/db/queries/course/member-progress';
import { calcCourseProgressPercent } from '@api/utils/course-completion';
import { buildCourseContent, type CourseContentItem } from '@cio/core/services/course/utils';

export type CourseMemberStage =
  | { kind: 'not_started' }
  | { kind: 'certificate_earned' }
  | {
      kind: 'content';
      position: number;
      title: string;
      contentType: 'lesson' | 'exercise' | 'activity';
    };

export type CourseMemberProgressSummary = {
  progressPercent: number;
  stage: CourseMemberStage;
  lastLoginAt: string | null;
  enrolledAt: string | null;
};

type TrackableContentItem = {
  id: string;
  type: ContentType.Lesson | ContentType.Exercise | ContentType.Activity;
  title: string;
  isComplete: boolean;
};

function toTrackableContentItems(contentItems: CourseContentItem[]): TrackableContentItem[] {
  const trackableItems: TrackableContentItem[] = [];

  for (const item of contentItems) {
    switch (item.type) {
      case ContentType.Lesson:
      case ContentType.Exercise:
      case ContentType.Activity:
        trackableItems.push({
          id: item.id,
          type: item.type,
          title: item.title,
          isComplete: item.isComplete ?? false
        });
        break;
      case ContentType.Section:
        break;
      default:
        break;
    }
  }

  return trackableItems;
}

function buildOrderedTrackableItems(
  contentRows: Awaited<ReturnType<typeof getCourseContentItems>>,
  isContentGroupingEnabled: boolean
): Omit<TrackableContentItem, 'isComplete'>[] {
  const content = buildCourseContent(contentRows, isContentGroupingEnabled);
  const orderedItems = content.grouped ? content.sections.flatMap((section) => section.items) : content.items;

  return toTrackableContentItems(orderedItems as CourseContentItem[]).map(({ id, type, title }) => ({
    id,
    type,
    title
  }));
}

function buildStudentTrackableItems(
  skeleton: Omit<TrackableContentItem, 'isComplete'>[],
  completedLessonIds: Set<string>,
  completedExerciseIds: Set<string>,
  completedActivityIds: Set<string>
): TrackableContentItem[] {
  return skeleton.map((item) => {
    switch (item.type) {
      case ContentType.Lesson:
        return {
          ...item,
          isComplete: completedLessonIds.has(item.id)
        };
      case ContentType.Exercise:
        return {
          ...item,
          isComplete: completedExerciseIds.has(item.id)
        };
      case ContentType.Activity:
        return {
          ...item,
          isComplete: completedActivityIds.has(item.id)
        };
      default:
        return {
          ...item,
          isComplete: false
        };
    }
  });
}

function contentTypeLabel(type: TrackableContentItem['type']): 'lesson' | 'exercise' | 'activity' {
  switch (type) {
    case ContentType.Lesson:
      return 'lesson';
    case ContentType.Exercise:
      return 'exercise';
    case ContentType.Activity:
      return 'activity';
    default:
      return 'lesson';
  }
}

export function deriveCourseMemberStage(params: {
  progressPercent: number;
  certificateEarnedAt: string | null;
  contentItems: TrackableContentItem[];
}): CourseMemberStage {
  if (params.certificateEarnedAt || params.progressPercent >= 100) {
    return { kind: 'certificate_earned' };
  }

  if (params.progressPercent === 0) {
    return { kind: 'not_started' };
  }

  const firstIncomplete = params.contentItems.find((item) => !item.isComplete);
  if (!firstIncomplete) {
    return { kind: 'certificate_earned' };
  }

  const position = params.contentItems.findIndex((item) => item.id === firstIncomplete.id) + 1;

  return {
    kind: 'content',
    position,
    title: firstIncomplete.title,
    contentType: contentTypeLabel(firstIncomplete.type)
  };
}

type StudentMember = {
  profileId: string;
  roleId: number;
  createdAt: string | null;
};

/**
 * Builds progress summaries for student members in a course.
 */
export async function getCourseMemberProgressSummaries(
  courseId: string,
  members: StudentMember[]
): Promise<Map<string, CourseMemberProgressSummary>> {
  const students = members.filter((member) => member.roleId === ROLE.STUDENT && member.profileId);
  const summaries = new Map<string, CourseMemberProgressSummary>();

  if (students.length === 0) {
    return summaries;
  }

  const profileIds = students.map((student) => student.profileId);

  const [
    courseRows,
    contentRows,
    contentCounts,
    membershipByProfileId,
    lessonCompletionsByProfileId,
    activityCompletionsByProfileId,
    lastSeenByProfileId
  ] = await Promise.all([
    getCourseById(courseId),
    getCourseContentItems(courseId),
    getCourseTrackableContentCounts(courseId),
    getBatchStudentCourseMembership(courseId, profileIds),
    getBatchLessonCompletionsForCourse(courseId, profileIds),
    getBatchActivityCompletionsForCourse(courseId, profileIds),
    getLastSeenForUserIds(profileIds)
  ]);

  const course = courseRows[0];
  const isContentGroupingEnabled = course?.metadata?.isContentGroupingEnabled ?? true;
  const trackableSkeleton = buildOrderedTrackableItems(contentRows, isContentGroupingEnabled);

  const groupMemberIds = profileIds
    .map((profileId) => membershipByProfileId.get(profileId)?.groupMemberId)
    .filter((groupMemberId): groupMemberId is string => !!groupMemberId);

  const exerciseCompletionsByMemberId = await getBatchCompletedExerciseIdsForMembers(courseId, groupMemberIds);

  for (const student of students) {
    const membership = membershipByProfileId.get(student.profileId);
    const completedLessonIds = lessonCompletionsByProfileId.get(student.profileId) ?? new Set<string>();
    const completedExerciseIds = membership
      ? (exerciseCompletionsByMemberId.get(membership.groupMemberId) ?? new Set<string>())
      : new Set<string>();
    const completedActivityIds = activityCompletionsByProfileId.get(student.profileId) ?? new Set<string>();

    const lessonsCompleted = trackableSkeleton.filter(
      (item) => item.type === ContentType.Lesson && completedLessonIds.has(item.id)
    ).length;
    const exercisesCompleted = trackableSkeleton.filter(
      (item) => item.type === ContentType.Exercise && completedExerciseIds.has(item.id)
    ).length;
    const activitiesCompleted = trackableSkeleton.filter(
      (item) => item.type === ContentType.Activity && completedActivityIds.has(item.id)
    ).length;

    const progressPercent = calcCourseProgressPercent({
      lessonsCompleted,
      totalLessons: contentCounts.lessonsCount,
      exercisesCompleted,
      exercisesCount: contentCounts.exercisesCount,
      activitiesCompleted,
      activitiesCount: contentCounts.activitiesCount
    });

    const contentItems = buildStudentTrackableItems(
      trackableSkeleton,
      completedLessonIds,
      completedExerciseIds,
      completedActivityIds
    );
    const certificateEarnedAt = membership?.certificateEarnedAt ?? null;

    const stage = deriveCourseMemberStage({
      progressPercent,
      certificateEarnedAt,
      contentItems
    });

    summaries.set(student.profileId, {
      progressPercent,
      stage,
      lastLoginAt: lastSeenByProfileId.get(student.profileId) ?? null,
      enrolledAt: student.createdAt ?? null
    });
  }

  return summaries;
}
