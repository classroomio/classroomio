import { ContentType, ROLE } from '@cio/utils/constants';
import { getMarksByCourseId, type Mark } from '@cio/db/queries/mark';
import { getCourseMembers } from '@cio/db/queries/course/people';
import { getCourseWithRelations } from '@cio/db/queries/course';
import { buildCourseContent, type CourseContentItem } from '@api/services/course/utils';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type GradebookExercise = {
  id: string;
  title: string;
  points: number;
};

export type GradebookStudentMarks = Record<string, Record<string, string>>;

export type GradebookResponse = {
  students: Awaited<ReturnType<typeof getCourseMembers>>;
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
      title: fromMarks?.title ?? '',
      points: fromMarks?.points ?? 0
    };
  });
}

/**
 * Returns all data needed to render the marks gradebook: students, exercises in order, and marks per student per exercise.
 */
export async function getGradebook(courseId: string): Promise<GradebookResponse> {
  try {
    const [marks, members, course] = await Promise.all([
      getMarksByCourseId(courseId),
      getCourseMembers(courseId),
      getCourseWithRelations(courseId)
    ]);

    const students = members.filter((m) => Number(m.roleId) === ROLE.STUDENT);

    let contentItems: CourseContentItem[] = [];
    if (course?.contentItems != null) {
      const isGrouping = course.metadata?.isContentGroupingEnabled ?? true;
      const content = buildCourseContent(course.contentItems, isGrouping);
      contentItems = content.grouped ? (content.sections ?? []).flatMap((s) => s.items ?? []) : (content.items ?? []);
    }

    const exercises = buildExercises(marks, contentItems);
    const studentMarksByExerciseId = buildStudentMarksByExerciseId(marks);

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
