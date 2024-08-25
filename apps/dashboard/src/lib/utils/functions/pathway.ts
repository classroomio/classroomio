import type { Pathway } from '../types';

export const isPathwayFree = (cost: number) => !(Number(cost) > 0);

export const getStudentInviteLink = (_pathway: Pathway, orgSiteName: string, origin: string) => {
  const hash = encodeURIComponent(
    btoa(
      JSON.stringify({
        id: _pathway.id,
        name: _pathway.title,
        description: _pathway.description,
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

export const getPathwayCompletedCoursesLength = (pathway: Pathway) => {
  if (!pathway.isPathway) return;
  const completedCourses = pathway.pathway_course.filter((pathwayCourse) => {
    const lessons = pathwayCourse.course.lesson;
    return lessons.length > 0 && lessons.every((lesson) => lesson.is_complete);
  }).length;
  console.log('lesson done', completedCourses);
  return completedCourses;
};

export const courseProgress = (lessons) => {
  const totalLesson = lessons.length;
  const completedLesson = lessons.filter((lesson) => lesson.is_complete).length;

  return (completedLesson / totalLesson) * 100;
};
