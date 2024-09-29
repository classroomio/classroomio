import type { Batch, Course } from '../types';

export const isCourseFree = (cost: number) => !(Number(cost) > 0);

export const getStudentInviteLink = (batch: Batch, _course: Course, orgSiteName: string, origin: string) => {
  const hash = encodeURIComponent(
    btoa(
      JSON.stringify({
        id: _course.id,
        name: _course.title,
        description: _course.description,
        batchId: batch.id,
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
