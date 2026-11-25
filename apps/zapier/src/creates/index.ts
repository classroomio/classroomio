import { addCohortMember, postCohortAnnouncement } from './cohorts';
import {
  getCourse,
  markLessonComplete,
  removeCourseMember,
  resetCourseProgress,
  revokeCourseInvite,
  sendCourseInvite
} from './courses';
import { addStudent, enrollStudent, getStudent, removeStudent, updateStudent } from './students';

export const creates = [
  enrollStudent,
  addStudent,
  updateStudent,
  removeStudent,
  removeCourseMember,
  sendCourseInvite,
  revokeCourseInvite,
  resetCourseProgress,
  markLessonComplete,
  addCohortMember,
  postCohortAnnouncement,
  getStudent,
  getCourse
];
