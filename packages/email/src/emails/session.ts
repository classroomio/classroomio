import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const sessionReminderEmail = defineEmail({
  id: 'sessionReminder',
  subject: (fields, context) => renderStudentEmailSubject('sessionReminder', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    sessionTitle: z.string().min(1),
    sessionTimeLabel: z.string().min(1),
    whenLabel: z.string().min(1),
    joinUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'sessionReminder',
      values: {
        org_name: fields.orgName,
        course_name: fields.courseName,
        session_title: fields.sessionTitle,
        session_time: fields.sessionTimeLabel,
        when: fields.whenLabel
      },
      actionUrl: fields.joinUrl,
      branding: fields.branding,
      context
    })
});

export const sessionUpdatedEmail = defineEmail({
  id: 'sessionUpdated',
  subject: (fields, context) => renderStudentEmailSubject('sessionUpdated', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    sessionTitle: z.string().min(1),
    sessionTimeLabel: z.string().min(1),
    joinUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'sessionUpdated',
      values: {
        org_name: fields.orgName,
        course_name: fields.courseName,
        session_title: fields.sessionTitle,
        session_time: fields.sessionTimeLabel
      },
      actionUrl: fields.joinUrl,
      branding: fields.branding,
      context
    })
});
