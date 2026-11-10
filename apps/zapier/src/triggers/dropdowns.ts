import { defineTrigger, type Bundle, type ZObject } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';

const PAGE_SIZE = 100;

type Option = { id: string; label: string };

export const courseListTrigger = defineTrigger({
  key: 'course_list',
  noun: 'Course',
  display: { label: 'List Courses', description: 'Lists courses for dropdowns.', hidden: true },
  operation: {
    canPaginate: true,
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl('/courses'),
        params: { page: String(bundle.meta.page + 1), limit: String(PAGE_SIZE) }
      });

      return (response.data.data as Array<{ id: string; title: string }>).map(({ id, title }) => ({ id, title }));
    }
  }
});

export const cohortListTrigger = defineTrigger({
  key: 'cohort_list',
  noun: 'Cohort',
  display: { label: 'List Cohorts', description: 'Lists cohorts for dropdowns.', hidden: true },
  operation: {
    canPaginate: true,
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl('/cohorts'),
        params: { page: String(bundle.meta.page + 1), limit: String(PAGE_SIZE) }
      });

      return (response.data.data as Array<{ id: string; name: string }>).map(({ id, name }) => ({ id, name }));
    }
  }
});

export const lessonListTrigger = defineTrigger({
  key: 'lesson_list',
  noun: 'Lesson',
  display: { label: 'List Lessons', description: 'Lists the lessons of the selected course.', hidden: true },
  operation: {
    canPaginate: true,
    perform: async (z, bundle: Bundle<Record<string, any>>) => {
      if (!bundle.inputData.courseId) return [];

      const response = await z.request({
        url: apiUrl(`/courses/${bundle.inputData.courseId}/lessons`),
        params: { page: String(bundle.meta.page + 1), limit: String(PAGE_SIZE) }
      });

      return (response.data.data as Array<{ id: string; title: string }>).map(({ id, title }) => ({ id, title }));
    }
  }
});

type CourseInvite = { id: string; status: string; allowedEmails: string[] | null };
type PaginatedResponse<T> = { data: T[]; pagination?: { totalPages?: number } };

async function listAllCourseInvites(z: ZObject, courseId: string) {
  const invites: CourseInvite[] = [];
  let page = 1;

  while (true) {
    const response = await z.request({
      url: apiUrl(`/courses/${courseId}/invites`),
      params: { page: String(page), limit: String(PAGE_SIZE) }
    });
    const body = response.data as PaginatedResponse<CourseInvite>;
    const batch = body.data ?? [];
    invites.push(...batch);

    const totalPages = body.pagination?.totalPages;
    const lastPage = totalPages !== undefined ? page >= totalPages : batch.length < PAGE_SIZE;

    if (lastPage) break;

    page += 1;
  }

  return invites;
}

export const courseInviteListTrigger = defineTrigger({
  key: 'course_invite_list',
  noun: 'Invite',
  display: { label: 'List Course Invites', description: 'Lists pending invites of the selected course.', hidden: true },
  operation: {
    perform: async (z, bundle: Bundle<Record<string, any>>) => {
      if (!bundle.inputData.courseId) return [];

      const invites = await listAllCourseInvites(z, String(bundle.inputData.courseId));

      return invites
        .filter((invite) => invite.status?.toLowerCase() === 'active')
        .map<Option>((invite) => ({ id: invite.id, label: invite.allowedEmails?.join(', ') || invite.id }));
    }
  }
});

export const dropdownTriggers = [courseListTrigger, cohortListTrigger, lessonListTrigger, courseInviteListTrigger];
