import { ContentType, ROLE } from '@cio/utils/constants';
import { getMarksByCourseId, type Mark } from '@cio/db/queries/mark';
import { getCourseMember, getCourseMembers, type CourseMemberWithProfile } from '@cio/db/queries/course/people';
import { getCourseWithRelations } from '@cio/db/queries/course';
import { buildCourseContent, type CourseContentItem } from '@api/services/course/utils';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { resolveMarksViewerScope } from './mark';

export type GradebookExercise = {
  id: string;
  title: string;
  points: number;
};

export type GradebookStudentMarks = Record<string, Record<string, string>>;

export type GradebookResponse = {
  students: CourseMemberWithProfile[];
  exercises: GradebookExercise[];
  studentMarksByExerciseId: GradebookStudentMarks;
};

function buildStudentMarksByExerciseId(marks: Mark[]): GradebookStudentMarks {
  const result: GradebookStudentMarks = {};
  for (const mark of marks) {
    const { groupmemberId, exerciseId, totalPointsGotten } = mark;
    if (!groupmemberId || !exerciseId) continue;
    if (!result[groupmemberId]) result[groupmemberId] = {};
    result[groupmemberId][exerciseId] = totalPointsGotten?.toString() ?? '0';
  }
  return result;
}

function buildExercises(marks: Mark[], contentItems: CourseContentItem[]): GradebookExercise[] {
  const marksByExerciseId = new Map<string, { title: string; points: number }>();
  const exerciseOrder: string[] = [];
  for (const mark of marks) {
    const { exerciseId, exerciseTitle, exercisePoints } = mark;
    if (!exerciseId) continue;
    if (!marksByExerciseId.has(exerciseId)) {
      exerciseOrder.push(exerciseId);
      marksByExerciseId.set(exerciseId, {
        title: exerciseTitle ?? '',
        points: exercisePoints ?? 0
      });
    }
  }

  const exerciseItems = contentItems.filter((item) => item.type === ContentType.Exercise);
  if (exerciseItems.length > 0) {
    return exerciseItems.map((item) => {
      const fromMarks = marksByExerciseId.get(item.id);
      return {
        id: item.id,
        title: item.title ?? fromMarks?.title ?? '',
        points: fromMarks?.points ?? 0
      };
    });
  }

  return exerciseOrder.map((id) => {
    const fromMarks = marksByExerciseId.get(id)!;
    return {
      id,
      title: fromMarks.title ?? '',
      points: fromMarks.points ?? 0
    };
  });
}

function scopeStudentMarksToMember(
  studentMarksByExerciseId: GradebookStudentMarks,
  groupMemberId: string | null
): GradebookStudentMarks {
  if (!groupMemberId) {
    return {};
  }

  const ownMarks = studentMarksByExerciseId[groupMemberId];
  if (!ownMarks) {
    return {};
  }

  return { [groupMemberId]: ownMarks };
}

async function loadGradebookStudents(
  courseId: string,
  canViewAllMarks: boolean,
  groupMemberId: string | null
): Promise<CourseMemberWithProfile[]> {
  if (canViewAllMarks) {
    const members = await getCourseMembers(courseId);
    return members.filter((member) => Number(member.roleId) === ROLE.STUDENT);
  }

  if (!groupMemberId) {
    return [];
  }

  const member = await getCourseMember(courseId, groupMemberId);
  if (!member || Number(member.roleId) !== ROLE.STUDENT) {
    return [];
  }

  return [member];
}

function flattenCourseContentItems(course: Awaited<ReturnType<typeof getCourseWithRelations>>): CourseContentItem[] {
  if (course?.contentItems == null) {
    return [];
  }

  const isGrouping = course.metadata?.isContentGroupingEnabled ?? true;
  const content = buildCourseContent(course.contentItems, isGrouping);
  return content.grouped ? (content.sections ?? []).flatMap((section) => section.items ?? []) : (content.items ?? []);
}

/**
 * Returns data needed to render the marks gradebook: students, exercises in order,
 * and marks per student per exercise.
 *
 * Instructors see every learner. Students only receive their own row and scores.
 */
export async function getGradebook(courseId: string, profileId: string): Promise<GradebookResponse> {
  try {
    const { canViewAllMarks, groupMemberId } = await resolveMarksViewerScope(courseId, profileId);

    const marksPromise = canViewAllMarks
      ? getMarksByCourseId(courseId)
      : groupMemberId
        ? getMarksByCourseId(courseId, groupMemberId)
        : Promise.resolve([] as Mark[]);
    const studentsPromise = loadGradebookStudents(courseId, canViewAllMarks, groupMemberId);
    const coursePromise = getCourseWithRelations(courseId);

    const [marks, students, course] = await Promise.all([marksPromise, studentsPromise, coursePromise]);

    const contentItems = flattenCourseContentItems(course);
    const exercises = buildExercises(marks, contentItems);
    const allStudentMarksByExerciseId = buildStudentMarksByExerciseId(marks);
    const studentMarksByExerciseId = canViewAllMarks
      ? allStudentMarksByExerciseId
      : scopeStudentMarksToMember(allStudentMarksByExerciseId, groupMemberId);

    return {
      students,
      exercises,
      studentMarksByExerciseId
    };
  } catch (error) {
    console.error('getGradebook error:', error);
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get gradebook',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
