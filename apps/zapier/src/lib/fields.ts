import { defineInputField } from 'zapier-platform-core';

export const courseFilterField = defineInputField({
  key: 'courseId',
  label: 'Course',
  dynamic: 'course_list.id.title',
  required: false,
  helpText: 'Only trigger for this course. Leave empty to trigger for every course.'
});

export const cohortFilterField = defineInputField({
  key: 'cohortId',
  label: 'Cohort',
  dynamic: 'cohort_list.id.name',
  required: false,
  helpText: 'Only trigger for this cohort. Leave empty to trigger for every cohort.'
});

export const sourceFilterField = defineInputField({
  key: 'source',
  label: 'How They Joined',
  required: false,
  list: true,
  choices: {
    invite: 'Course invite',
    invite_link: 'Invite link',
    self_enroll: 'Self-enrollment',
    admin: 'Added by an admin or tutor',
    api: 'API or Zapier',
    import: 'Bulk import',
    sso: 'Single sign-on',
    payment: 'Paid enrollment',
    cohort: 'Added through a cohort'
  },
  helpText: 'Only trigger for these ways of joining. Leave empty to trigger for all of them.'
});

export const roleFilterField = defineInputField({
  key: 'role',
  label: 'Role',
  required: false,
  choices: { student: 'Student', tutor: 'Tutor', admin: 'Admin' },
  helpText: 'Only trigger for this role. Leave empty to trigger for everyone.'
});

export const courseField = defineInputField({
  key: 'courseId',
  label: 'Course',
  dynamic: 'course_list.id.title',
  required: true,
  altersDynamicFields: true
});

export const cohortField = defineInputField({
  key: 'cohortId',
  label: 'Cohort',
  dynamic: 'cohort_list.id.name',
  required: true
});

export const studentEmailField = defineInputField({
  key: 'email',
  label: 'Student Email',
  type: 'string',
  required: true
});

export const sendEmailField = defineInputField({
  key: 'sendEmail',
  label: 'Send Email',
  type: 'boolean',
  default: 'true',
  required: false,
  helpText: 'Email the student about this change.'
});
