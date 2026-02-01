import { classroomio } from '$lib/utils/services/api';
import { getApiHeaders } from '$lib/utils/services/api';
import type { Marks } from '$features/course/utils/types';
import {
  processMarksIntoStudentMarksByExerciseId,
  processMarksIntoLessonMapping,
  type MarksPageData
} from '$features/course/utils/marks-utils';
import { ROLE } from '@cio/utils/constants';
import type { CourseMembers } from '$features/course/utils/types';

export const load = async ({ params, cookies }) => {
  const courseId = params.id || '';
  if (!courseId) {
    return {
      courseId: '',
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

  // Get students via members endpoint (avoid relying on parent().course)
  const membersRes = await classroomio.course[':courseId'].members.$get(
    {
      param: { courseId }
    },
    getApiHeaders(cookies, '')
  );
  const membersJson = await membersRes.json();
  const members: CourseMembers = membersJson.success && membersJson.data ? membersJson.data : [];
  const students: CourseMembers = members.filter((member) => Number(member.roleId) === ROLE.STUDENT);

  // Return processed data structure
  const marksData: MarksPageData = {
    studentMarksByExerciseId,
    lessonMapping,
    students
  };

  return {
    courseId,
    marksData
  };
};
