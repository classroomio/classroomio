import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentCourseInviteEmail = defineEmail({
  id: 'studentCourseInvite',
  subject: 'You are invited to join a course',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    inviteLink: z.string().url(),
    expiresAt: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>You have been invited to join <strong>${fields.courseName}</strong> on ${fields.orgName}.</p>
      <p>This invitation expires at <strong>${fields.expiresAt}</strong>.</p>
      <div>
        <a class="button" href="${fields.inviteLink}">Join Course</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
