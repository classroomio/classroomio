import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const quizAssignedEmail = defineEmail({
  id: 'quizAssigned',
  subject: (fields, context) => renderStudentEmailSubject('quizAssigned', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    quizUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'quizAssigned',
      values: { org_name: fields.orgName, course_name: fields.courseName, exercise_title: fields.exerciseTitle },
      actionUrl: fields.quizUrl,
      branding: fields.branding,
      context
    })
});
