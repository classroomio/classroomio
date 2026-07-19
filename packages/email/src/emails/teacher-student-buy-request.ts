import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const teacherStudentBuyRequestEmail = defineEmail({
  id: 'teacherStudentBuyRequest',
  subject: 'Request to Join Course!',
  schema: z.object({
    courseName: z.string().min(1),
    studentEmail: z.string().email(),
    studentFullname: z.string().min(1),
    courseUrl: z.url(),
    autoEnrollUrl: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi amazing tutor,</p>
      <p>A new student has requested to join a course you are teaching: "${fields.courseName}"</p>
      <p style="font-weight: bold;">Student details</p>
      <p>
        Name: ${fields.studentFullname}<br />
        Email: ${fields.studentEmail}
      </p>
      <p style="font-weight: bold; margin-top: 24px;">How to give this student access</p>
      <ol style="padding-left: 20px; line-height: 1.6;">
        <li>Open the course: <a href="${fields.courseUrl}">${fields.courseUrl}</a></li>
        <li>Click <strong>People</strong> on the sidebar</li>
        <li>Click <strong>Add</strong></li>
        <li>Under <strong>Invite new students</strong>, enter <strong>${fields.studentEmail}</strong></li>
        <li>Click <strong>Invite Students</strong></li>
      </ol>
      <p style="font-weight: bold; margin-top: 24px;">Or automatically enroll them</p>
      <p>Use the button below to open the course and send this student an invite in one step.</p>
      <div>
        <a class="button" href="${fields.autoEnrollUrl}">Auto Enrol this Student</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
