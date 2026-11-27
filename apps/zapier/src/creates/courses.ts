import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { courseField, studentEmailField } from '../lib/fields';
import { requireCourseMemberId } from '../lib/lookups';

const SINGLE_INVITE_PRESET = 'MULTI_USE_7D';

export const removeCourseMember = defineCreate({
  key: 'remove_course_member',
  noun: 'Enrollment',
  display: {
    label: 'Remove Student From Course',
    description: 'Removes a student from one course and keeps them in your organization.'
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({ url: apiUrl(`/courses/${courseId}/members/${memberId}`), method: 'DELETE' });

      return response.data.data;
    },
    sample: {
      id: '000000d1-0000-4000-8000-0000000000d1',
      groupId: '000000c1-0000-4000-8000-0000000000c1',
      roleId: 3,
      profileId: '000000b1-0000-4000-8000-0000000000b1',
      email: 'student@example.com',
      createdAt: '2026-10-01T00:00:00.000Z',
      assignedStudentId: null,
      certificateEarnedAt: null,
      certificationEmailSentAt: null
    }
  }
});

const SKIPPED_INVITE_STATUSES = new Set(['is_staff', 'archived', 'over_seat_limit', 'invalid_email']);

export const sendCourseInvite = defineCreate({
  key: 'send_course_invite',
  noun: 'Invite',
  display: { label: 'Send Course Invite', description: 'Emails an invite to join a course.' },
  operation: {
    inputFields: defineInputFields([
      courseField,
      {
        key: 'emails',
        label: 'Emails',
        list: true,
        required: true,
        helpText: 'Each address gets the course on its organization invite; people who already joined are enrolled.'
      }
    ]),
    perform: async (z, bundle) => {
      const emails = (bundle.inputData.emails as string[]).map((email) => email.trim()).filter(Boolean);
      const response = await z.request({
        url: apiUrl(`/courses/${bundle.inputData.courseId}/invites`),
        method: 'POST',
        body: { preset: SINGLE_INVITE_PRESET, recipientEmails: emails, allowedEmails: emails, sendEmail: true }
      });
      const data = response.data.data as {
        recipients?: Array<{ email: string; status: string }>;
        delivery?: {
          requested: number;
          sent: number;
          failed: number;
          failures: Array<{ email: string; error: string }>;
        };
      };
      const skipped = (data.recipients ?? []).filter((recipient) => SKIPPED_INVITE_STATUSES.has(recipient.status));

      if (skipped.length > 0) {
        const detail = skipped.map((recipient) => `${recipient.email}: ${recipient.status}`).join('; ');
        throw new z.errors.Error(`ClassroomIO could not invite ${detail}`, 'InviteSkipped', 422);
      }

      const failed = data.delivery?.failed ?? 0;

      if (failed > 0) {
        const failures = data.delivery?.failures ?? [];
        const detail = failures.map((failure) => `${failure.email}: ${failure.error}`).join('; ');
        throw new z.errors.Error(
          `ClassroomIO could not email ${failed} invite${failed === 1 ? '' : 's'}${detail ? ` (${detail})` : ''}`,
          'EmailError',
          502
        );
      }

      return data;
    },
    sample: {
      mode: 'bulk',
      invites: [],
      inviteLink: null,
      recipients: [
        {
          email: 'student@example.com',
          status: 'invited',
          inviteId: '000000e1-0000-4000-8000-0000000000e1',
          inviteKind: 'organization',
          inviteLink: 'https://acme.myclassroomio.com/invite/token'
        }
      ],
      duplicatesSkipped: [],
      delivery: { requested: 1, sent: 1, failed: 0, failures: [] }
    }
  }
});

export const revokeCourseInvite = defineCreate({
  key: 'revoke_course_invite',
  noun: 'Invite',
  display: {
    label: 'Revoke Course Invite',
    description: 'Removes this course from a pending invite, or cancels a course invite link so it stops working.'
  },
  operation: {
    inputFields: defineInputFields([
      courseField,
      {
        key: 'inviteId',
        label: 'Invite',
        dynamic: 'course_invite_list.id.label',
        required: true,
        helpText:
          'Pick an invite link, or pass an organization invite id from Send Course Invite or Enroll Student to remove just this course from it.'
      }
    ]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/courses/${bundle.inputData.courseId}/invites/${bundle.inputData.inviteId}/revoke`),
        method: 'POST'
      });

      return response.data.data;
    },
    sample: { id: '000000e1-0000-4000-8000-0000000000e1', status: 'REVOKED', isRevoked: true }
  }
});

export const resetCourseProgress = defineCreate({
  key: 'reset_course_progress',
  noun: 'Progress',
  display: {
    label: 'Reset Student Course Progress',
    description: "Clears a student's progress in a course and keeps them enrolled. This can't be undone."
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({
        url: apiUrl(`/courses/${courseId}/members/${memberId}/reset-progress`),
        method: 'POST'
      });

      return response.data.data;
    },
    sample: {
      lessonCompletion: 1,
      lessonVideoProgress: 0,
      submissions: 0,
      groupAttendance: 0,
      lessonComments: 0,
      courseNewsfeed: 0,
      courseNewsfeedComments: 0,
      courseCertificateIssues: 0,
      courseCompletionRecords: 0,
      aiChatConversations: 0
    }
  }
});

export const markLessonComplete = defineCreate({
  key: 'mark_lesson_complete',
  noun: 'Lesson Completion',
  display: { label: 'Mark Lesson Complete', description: 'Marks a lesson complete for a student.' },
  operation: {
    inputFields: defineInputFields([
      courseField,
      { key: 'lessonId', label: 'Lesson', dynamic: 'lesson_list.id.title', required: true },
      studentEmailField
    ]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({
        url: apiUrl(`/courses/${courseId}/members/${memberId}/lessons/${bundle.inputData.lessonId}/completion`),
        method: 'PUT',
        body: { isComplete: true }
      });

      return response.data.data;
    },
    sample: {
      lessonId: '000000f1-0000-4000-8000-0000000000f1',
      memberId: '000000d1-0000-4000-8000-0000000000d1',
      isComplete: true,
      updatedAt: '2026-10-01T00:00:00.000Z'
    }
  }
});
