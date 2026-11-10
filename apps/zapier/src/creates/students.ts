import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { courseField, sendEmailField, studentEmailField } from '../lib/fields';
import { throwApiErrors } from '../lib/http';
import { findStudentByEmail, requireStudentByEmail, STUDENT_OUTPUT_FIELDS, STUDENT_SAMPLE } from '../lib/lookups';

const CONFLICT_STATUS = 409;
const IMPORT_SUCCESS_STATUSES = new Set(['ready', 'already_member', 'invite_resent']);

function describeImportFailure(status: string, email: string): string {
  switch (status) {
    case 'invalid_email':
    case 'missing_email':
      return `"${email}" is not a valid email address.`;
    case 'duplicate_in_file':
      return `"${email}" was skipped as a duplicate.`;
    case 'is_staff':
      return `"${email}" belongs to an admin or tutor, not a student.`;
    case 'over_seat_limit':
      return `Your plan has no student seats left, so "${email}" was not added.`;
    default:
      return `ClassroomIO could not add "${email}" to your organization (status: ${status}).`;
  }
}

export const enrollStudent = defineCreate({
  key: 'enroll_student',
  noun: 'Enrollment',
  display: {
    label: 'Enroll Student in Course',
    description: 'Enrolls a student in a course by email, inviting them first if they are new.'
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField, sendEmailField]),
    perform: async (z, bundle) => {
      const request = {
        url: apiUrl(`/courses/${bundle.inputData.courseId}/enrollments`),
        method: 'POST' as const,
        body: { email: bundle.inputData.email, sendEmail: bundle.inputData.sendEmail !== false }
      };
      const response = await z.request({ ...request, skipThrowForStatus: true });

      if (response.status === CONFLICT_STATUS && (response.data as { code?: string }).code === 'CONFLICT') {
        const retry = await z.request(request);

        return retry.data.data;
      }

      throwApiErrors(response, z);

      return response.data.data;
    },
    sample: {
      status: 'enrolled',
      memberId: '000000d1-0000-4000-8000-0000000000d1',
      inviteId: null,
      email: 'student@example.com'
    },
    outputFields: [
      { key: 'status', label: 'Result' },
      { key: 'memberId', label: 'Course Member ID' },
      { key: 'inviteId', label: 'Invite ID' },
      { key: 'email', label: 'Email' }
    ]
  }
});

export const addStudent = defineCreate({
  key: 'add_student',
  noun: 'Student',
  display: {
    label: 'Add Student to Organization',
    description: 'Invites a student to your organization without enrolling them in a course.'
  },
  operation: {
    inputFields: defineInputFields([studentEmailField, sendEmailField]),
    perform: async (z, bundle) => {
      const email = String(bundle.inputData.email).trim().toLowerCase();
      const response = await z.request({
        url: apiUrl('/audience'),
        method: 'POST',
        body: { email, sendEmail: bundle.inputData.sendEmail !== false }
      });
      const result = response.data.data as {
        rows?: Array<{ email: string; status: string }>;
      };
      const row = result.rows?.find((entry) => entry.email.trim().toLowerCase() === email);

      if (row && !IMPORT_SUCCESS_STATUSES.has(row.status)) {
        throw new z.errors.Error(describeImportFailure(row.status, email), 'InvalidInput', 400);
      }

      const member = await findStudentByEmail(z, email);

      if (!member) {
        throw new z.errors.Error(
          `ClassroomIO added "${email}" but did not return a student record. Check the student in your audience and try again.`,
          'NotFound',
          404
        );
      }

      return member;
    },
    sample: STUDENT_SAMPLE,
    outputFields: STUDENT_OUTPUT_FIELDS
  }
});

export const updateStudent = defineCreate({
  key: 'update_student',
  noun: 'Student',
  display: {
    label: 'Update Student',
    description: "Updates a student's name, or the email of an invite that hasn't been accepted."
  },
  operation: {
    inputFields: defineInputFields([
      { ...studentEmailField, label: 'Current Email' },
      { key: 'name', label: 'New Name', required: false, helpText: 'Applies to students who have joined.' },
      {
        key: 'newEmail',
        label: 'New Email',
        required: false,
        helpText: "Applies to invites that haven't been accepted."
      }
    ]),
    perform: async (z, bundle) => {
      const member = await requireStudentByEmail(z, String(bundle.inputData.email));
      const body = member.profileId ? { name: bundle.inputData.name } : { email: bundle.inputData.newEmail };

      if (!Object.values(body).some(Boolean)) {
        throw new z.errors.Error(
          member.profileId
            ? 'This student has joined, so only their name can be changed. Fill in New Name.'
            : "This student hasn't joined yet, so only the invite email can be changed. Fill in New Email.",
          'InvalidInput',
          400
        );
      }

      const response = await z.request({ url: apiUrl(`/audience/${member.id}`), method: 'PUT', body });

      return response.data.data;
    },
    sample: {
      id: 1042,
      profileId: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      avatarUrl: '',
      createdAt: 'Mon Oct 05 2026',
      status: 'active',
      memberStatus: 'ACTIVE',
      lastLoginAt: null,
      lastActiveAt: null,
      enrolledCount: 1,
      completedCount: 0,
      progressPercent: 0,
      certificateCount: 0
    }
  }
});

export const removeStudent = defineCreate({
  key: 'remove_student',
  noun: 'Student',
  display: {
    label: 'Remove Student From Organization',
    description: 'Removes a student from your organization and all of its courses.'
  },
  operation: {
    inputFields: defineInputFields([studentEmailField]),
    perform: async (z, bundle) => {
      const member = await requireStudentByEmail(z, String(bundle.inputData.email));
      const response = await z.request({ url: apiUrl(`/audience/${member.id}`), method: 'DELETE' });

      return response.data.data;
    },
    sample: {
      id: 1042,
      organizationId: '000000a1-0000-4000-8000-0000000000a1',
      roleId: 3,
      profileId: '000000b1-0000-4000-8000-0000000000b1',
      email: 'student@example.com',
      verified: true,
      status: 'ARCHIVED',
      statusChangedAt: '2026-10-30T00:00:00.000Z',
      statusChangedBy: null,
      lastActiveAt: null,
      createdAt: '2026-10-01T00:00:00.000Z'
    }
  }
});
