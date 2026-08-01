import { ROLE } from '@cio/utils/constants';
import { ContentType } from '@cio/utils/constants/content';
import { getLastSeenForUserIds } from '@cio/db/queries/analytics';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { getCourseProgress } from '@cio/db/queries/course/course';
import { calcCourseProgressPercent } from '@api/utils/course-completion';

export type CourseMemberStage =
  | { kind: 'not_started' }
  | { kind: 'certificate_earned' }
  | {
      kind: 'content';
      position: number;
      title: string;
      contentType: 'lesson' | 'exercise';
    };

export type CourseMemberProgressSummary = {
  progressPercent: number;
  stage: CourseMemberStage;
  lastLoginAt: string | null;
  enrolledAt: string | null;
};

type TrackableContentItem = {
  id: string;
  type: ContentType.Lesson | ContentType.Exercise;
  title: string;
  order: number | null;
  createdAt: string | null;
  isComplete: boolean | null;
};

const CONTENT_TYPE_PRIORITY: Record<ContentType.Lesson | ContentType.Exercise, number> = {
  [ContentType.Lesson]: 0,
  [ContentType.Exercise]: 1
};

function sortTrackableContentItems(items: TrackableContentItem[]): TrackableContentItem[] {
  return [...items].sort((left, right) => {
    const orderDiff = (left.order ?? 0) - (right.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    const typeDiff = CONTENT_TYPE_PRIORITY[left.type] - CONTENT_TYPE_PRIORITY[right.type];
    if (typeDiff !== 0) return typeDiff;

    return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
  });
}

function toTrackableContentItems(rows: Awaited<ReturnType<typeof getCourseContentItems>>): TrackableContentItem[] {
  const trackableItems: TrackableContentItem[] = [];

  for (const row of rows) {
    if (row.type !== ContentType.Lesson && row.type !== ContentType.Exercise) {
      continue;
    }

    trackableItems.push({
      id: row.id,
      type: row.type,
      title: row.title ?? '',
      order: row.order,
      createdAt: row.createdAt,
      isComplete: row.isComplete
    });
  }

  return trackableItems;
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
    contentType: firstIncomplete.type === ContentType.Exercise ? 'exercise' : 'lesson'
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
  const lastSeenByProfileId = await getLastSeenForUserIds(profileIds);

  const progressResults = await Promise.all(
    students.map(async (student) => {
      const [courseProgress, contentRows] = await Promise.all([
        getCourseProgress(courseId, student.profileId),
        getCourseContentItems(courseId, student.profileId)
      ]);

      const contentItems = sortTrackableContentItems(toTrackableContentItems(contentRows));
      const progressPercent = calcCourseProgressPercent({
        lessonsCompleted: courseProgress.lessonsCompleted,
        totalLessons: courseProgress.lessonsCount,
        exercisesCompleted: courseProgress.exercisesCompleted,
        exercisesCount: courseProgress.exercisesCount
      });

      const stage = deriveCourseMemberStage({
        progressPercent,
        certificateEarnedAt: courseProgress.certificateEarnedAt,
        contentItems
      });

      return {
        profileId: student.profileId,
        summary: {
          progressPercent,
          stage,
          lastLoginAt: lastSeenByProfileId.get(student.profileId) ?? null,
          enrolledAt: student.createdAt ?? null
        }
      };
    })
  );

  for (const result of progressResults) {
    summaries.set(result.profileId, result.summary);
  }

  return summaries;
}
