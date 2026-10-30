import type { TWebhookEventType } from './webhook';

export const ZAPIER_HOOK_HOSTS = ['hooks.zapier.com'] as const;

export const ZAPIER_OAUTH_SCOPES = [
  'offline_access',
  'audience:read',
  'audience:write',
  'course:read',
  'course:member:read',
  'course:member:write',
  'course:student:write',
  'course:certificate:read',
  'cohort:read',
  'cohort:write',
  'webhook:subscription:read',
  'webhook:subscription:write'
] as const;

export const ZAPIER_TRIGGER_FILTERS = ['course', 'cohort', 'source', 'role'] as const;
export type TZapierTriggerFilter = (typeof ZAPIER_TRIGGER_FILTERS)[number];

export type TZapierTrigger = {
  key: string;
  eventType: TWebhookEventType;
  noun: string;
  label: string;
  description: string;
  filters: readonly TZapierTriggerFilter[];
};

export const ZAPIER_TRIGGERS = [
  {
    key: 'new_course_enrollment',
    eventType: 'course.member.added',
    noun: 'Enrollment',
    label: 'New Course Enrollment',
    description: 'Triggers when a student is added to a course, however they joined.',
    filters: ['course', 'source']
  },
  {
    key: 'course_member_removed',
    eventType: 'course.member.removed',
    noun: 'Enrollment',
    label: 'Student Removed from Course',
    description: 'Triggers when a student is removed from a course.',
    filters: ['course']
  },
  {
    key: 'course_completed',
    eventType: 'course.completed',
    noun: 'Completion',
    label: 'Course Completed',
    description: 'Triggers when a student completes every required lesson in a course.',
    filters: ['course']
  },
  {
    key: 'new_certificate',
    eventType: 'course.certificate.issued',
    noun: 'Certificate',
    label: 'New Certificate',
    description: 'Triggers when a certificate is issued to a student.',
    filters: ['course']
  },
  {
    key: 'new_submission',
    eventType: 'course.submission.created',
    noun: 'Submission',
    label: 'New Exercise Submission',
    description: 'Triggers when a student submits an exercise.',
    filters: ['course']
  },
  {
    key: 'submission_status_changed',
    eventType: 'course.submission.status_changed',
    noun: 'Submission',
    label: 'Submission Status Changed',
    description: 'Triggers when a submission is graded or its status changes.',
    filters: ['course']
  },
  {
    key: 'lesson_completed',
    eventType: 'lesson.completion.updated',
    noun: 'Lesson Completion',
    label: 'Lesson Completed',
    description: 'Triggers when a student completes a lesson.',
    filters: ['course']
  },
  {
    key: 'course_invite_accepted',
    eventType: 'course.invite.accepted',
    noun: 'Invite',
    label: 'Course Invite Accepted',
    description: 'Triggers when someone accepts a course invite.',
    filters: ['course']
  },
  {
    key: 'new_payment_request',
    eventType: 'course.payment_request.created',
    noun: 'Payment Request',
    label: 'New Payment Request',
    description: 'Triggers when a learner submits a payment request for a course.',
    filters: ['course']
  },
  {
    key: 'new_organization_member',
    eventType: 'organization.member.added',
    noun: 'Member',
    label: 'New Organization Member',
    description: 'Triggers when someone joins the organization as a student, tutor or admin.',
    filters: ['role']
  },
  {
    key: 'compliance_status_changed',
    eventType: 'compliance.record.status_changed',
    noun: 'Compliance Record',
    label: 'Compliance Status Changed',
    description: "Triggers when a learner's compliance status changes, for example to overdue or expired.",
    filters: ['course']
  },
  {
    key: 'course_published',
    eventType: 'course.published',
    noun: 'Course',
    label: 'Course Published',
    description: 'Triggers when a course is published.',
    filters: []
  },
  {
    key: 'live_session_scheduled',
    eventType: 'lesson.session.scheduled',
    noun: 'Live Session',
    label: 'Live Session Scheduled',
    description: 'Triggers when a live session is scheduled or rescheduled.',
    filters: ['course']
  },
  {
    key: 'new_cohort_member',
    eventType: 'cohort.member.added',
    noun: 'Cohort Member',
    label: 'New Cohort Member',
    description: 'Triggers when a student is added to a cohort.',
    filters: ['cohort']
  }
] as const satisfies readonly TZapierTrigger[];
export type TZapierTriggerKey = (typeof ZAPIER_TRIGGERS)[number]['key'];

export const ZAPIER_ACTIONS = [
  {
    key: 'enroll_student',
    noun: 'Enrollment',
    label: 'Enroll Student in Course',
    description: 'Enrolls a student in a course by email, inviting them first if they are new.'
  },
  {
    key: 'add_student',
    noun: 'Student',
    label: 'Add Student to Organization',
    description: 'Invites a student to your organization without enrolling them in a course.'
  },
  {
    key: 'update_student',
    noun: 'Student',
    label: 'Update Student',
    description: "Updates a student's name, or the email of an invite that hasn't been accepted."
  },
  {
    key: 'remove_student',
    noun: 'Student',
    label: 'Remove Student from Organization',
    description: 'Removes a student from your organization.'
  },
  {
    key: 'remove_course_member',
    noun: 'Enrollment',
    label: 'Remove Student from Course',
    description: 'Removes a student from one course and keeps them in your organization.'
  },
  {
    key: 'send_course_invite',
    noun: 'Invite',
    label: 'Send Course Invite',
    description: 'Emails an invite to join a course.'
  },
  {
    key: 'revoke_course_invite',
    noun: 'Invite',
    label: 'Revoke Course Invite',
    description: 'Cancels a pending course invite so its link stops working.'
  },
  {
    key: 'reset_course_progress',
    noun: 'Progress',
    label: 'Reset Student Course Progress',
    description: "Clears a student's progress in a course and keeps them enrolled."
  },
  {
    key: 'mark_lesson_complete',
    noun: 'Lesson Completion',
    label: 'Mark Lesson Complete',
    description: 'Marks a lesson complete for a student.'
  },
  {
    key: 'add_cohort_member',
    noun: 'Cohort Member',
    label: 'Add Student to Cohort',
    description: 'Adds a student to a cohort.'
  },
  {
    key: 'post_cohort_announcement',
    noun: 'Announcement',
    label: 'Post to Cohort Feed',
    description: "Posts an announcement to a cohort's feed."
  }
] as const;
export type TZapierActionKey = (typeof ZAPIER_ACTIONS)[number]['key'];

export const ZAPIER_SEARCHES = [
  {
    key: 'find_student',
    noun: 'Student',
    label: 'Find Student',
    description: 'Finds a student in your organization by email.'
  },
  {
    key: 'find_course',
    noun: 'Course',
    label: 'Find Course',
    description: 'Finds a course by its slug or exact title.'
  }
] as const;
export type TZapierSearchKey = (typeof ZAPIER_SEARCHES)[number]['key'];
