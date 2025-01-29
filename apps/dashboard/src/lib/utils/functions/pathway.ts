import type { LMSCourse, Pathway } from '../types';

export const isPathwayFree = (cost: number) => !(Number(cost) > 0);

export const getStudentInviteLink = (_pathway: Pathway, orgSiteName: string, origin: string) => {
  const hash = encodeURIComponent(
    btoa(
      JSON.stringify({
        id: _pathway.id,
        name: _pathway.title,
        description: _pathway.description,
        isPathway: true,
        orgSiteName
      })
    )
  );

  return `${origin}/invite/s/${hash}`;
};

const tagsToReplace: { [k: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

export function replaceHTMLTag(text: string) {
  return text
    .split('')
    .map((char) => tagsToReplace[char] || char)
    .join('');
}

export const getPathwayCompletedCoursesLength = (course: LMSCourse) => {
  const completedCourses = course?.pathway_course?.filter((pathwayCourse) => {
    const lessons = pathwayCourse.course?.lesson;
    return lessons?.length > 0 && lessons?.every((lesson) => lesson.is_complete);
  }).length;
  return completedCourses || 0;
};

export const getIsPathwayComplete = (course: LMSCourse) => {
  const completedCourses = getPathwayCompletedCoursesLength(course);
  return completedCourses === course?.pathway_course?.length;
};

export const courseProgress = (lessons) => {
  const totalLesson = lessons.length;
  const completedLesson = lessons.filter((lesson) => lesson.is_complete).length;

  return (completedLesson / totalLesson) * 100;
};
