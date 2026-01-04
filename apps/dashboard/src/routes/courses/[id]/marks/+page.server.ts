import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';
import type { Marks } from '$features/course/utils/types';
import {
  processMarksIntoStudentMarksByExerciseId,
  processMarksIntoLessonMapping,
  type MarksPageData
} from '$features/course/utils/marks-utils';
import { ROLE } from '@cio/utils/constants';
import type { GroupMember } from '$features/course/utils/types';

export const load = async ({ params, cookies, parent }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      course: null,
      courseId: '',
      marksData: null
    };
  }

  // Get course data from parent layout (already loaded)
  const { course } = await parent();
  if (!course) {
    return {
      course: null,
      courseId,
      marksData: null
    };
  }

  // Fetch marks using single API call
  const response = await classroomio.course[':courseId'].mark.$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies, '')
  );

  const data = await response.json();
  const marks: Marks = data.success && data.data ? data.data : [];

  // Process marks data to derive both structures
  const studentMarksByExerciseId = processMarksIntoStudentMarksByExerciseId(marks);
  const lessonMapping = processMarksIntoLessonMapping(marks);

  // Get students from course.group.members (already loaded by parent layout)
  const students: GroupMember[] =
    course.group?.members?.filter((member: GroupMember) => Number(member.roleId) === ROLE.STUDENT) || [];

  // Return processed data structure
  const marksData: MarksPageData = {
    studentMarksByExerciseId,
    lessonMapping,
    students
  };

  return {
    course,
    courseId,
    marksData
  };
};
