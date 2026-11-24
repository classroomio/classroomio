import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { cohortField, studentEmailField } from '../lib/fields';
import { STUDENT_ROLE_ID } from '../lib/lookups';

export const addCohortMember = defineCreate({
  key: 'add_cohort_member',
  noun: 'Cohort Member',
  display: { label: 'Add Student to Cohort', description: 'Adds a student to a cohort.' },
  operation: {
    inputFields: defineInputFields([cohortField, studentEmailField, { key: 'name', label: 'Name', required: false }]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/cohorts/${bundle.inputData.cohortId}/members`),
        method: 'POST',
        body: {
          members: [{ email: bundle.inputData.email, name: bundle.inputData.name, roleId: STUDENT_ROLE_ID }]
        }
      });
      const result = response.data.data as { added: unknown[]; errors: Array<{ message?: string }> };

      if (result.added.length === 0 && result.errors.length > 0) {
        throw new z.errors.Error(result.errors[0]?.message ?? 'The student could not be added', 'InvalidInput', 400);
      }

      return result;
    },
    sample: {
      added: [
        {
          id: '000000c2-0000-4000-8000-0000000000c2',
          cohortId: '000000c1-0000-4000-8000-0000000000c1',
          profileId: '000000b1-0000-4000-8000-0000000000b1',
          roleId: STUDENT_ROLE_ID,
          email: 'student@example.com',
          createdAt: '2026-10-01T00:00:00.000Z'
        }
      ],
      errors: []
    }
  }
});

export const postCohortAnnouncement = defineCreate({
  key: 'post_cohort_announcement',
  noun: 'Announcement',
  display: { label: 'Post to Cohort Feed', description: "Posts an announcement to a cohort's feed." },
  operation: {
    inputFields: defineInputFields([
      cohortField,
      { key: 'content', label: 'Message', type: 'text', required: true },
      { key: 'isPinned', label: 'Pin Post', type: 'boolean', required: false }
    ]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/cohorts/${bundle.inputData.cohortId}/newsfeed`),
        method: 'POST',
        body: { content: bundle.inputData.content, isPinned: bundle.inputData.isPinned === true }
      });

      return response.data.data;
    },
    sample: {
      id: '000000f2-0000-4000-8000-0000000000f2',
      createdAt: '2026-10-01T00:00:00.000Z',
      authorId: '000000c2-0000-4000-8000-0000000000c2',
      cohortId: '000000c1-0000-4000-8000-0000000000c1',
      content: 'Welcome to the cohort!',
      reaction: null,
      isPinned: false
    }
  }
});
