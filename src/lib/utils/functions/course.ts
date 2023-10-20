import { browser } from '$app/environment';
import type { Course } from '../types';

export const isCourseFree = (cost: number) => !(Number(cost) > 0);

export const getStudentInviteLink = (_course: Course, orgSiteName: string) => {
  const hash = encodeURIComponent(
    btoa(
      JSON.stringify({
        groupId: _course.group?.id,
        name: _course.title,
        description: _course.description,
        orgSiteName
      })
    )
  );

  return `https://${orgSiteName}.classroomio.com/invite/s/${hash}`;
};

export const getTextFromHTML = (html: string): string => {
  if (!browser) return html;

  const dummyDiv = document.createElement('div');
  dummyDiv.innerHTML = html;

  return dummyDiv.textContent?.trim() || '';
};
