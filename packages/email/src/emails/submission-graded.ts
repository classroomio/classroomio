import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { getStudentEmailCopy, renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';
import { getStudentEmailSubmissionStatusLabel } from '@cio/utils/email';

export const submissionGradedEmail = defineEmail({
  id: 'submissionGraded',
  subject: (fields, context) => renderStudentEmailSubject('submissionGraded', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    studentName: z.string().min(1),
    exerciseTitle: z.string().min(1),
    courseName: z.string().min(1),
    statusId: z.number().int().positive(),
    exerciseLink: z.string().min(1),
    score: z.string().optional(),
    lessonTitle: z.string().optional(),
    branding: ZEmailBranding
  }),
  render: (fields, context) => {
    const { locale, copy } = getStudentEmailCopy('submissionGraded', context);

    return renderStudentEmail({
      id: 'submissionGraded',
      values: {
        org_name: fields.orgName,
        student_name: fields.studentName,
        exercise_title: fields.exerciseTitle,
        course_name: fields.courseName,
        status: getStudentEmailSubmissionStatusLabel(fields.statusId, locale),
        score: fields.score,
        lesson_title: fields.lessonTitle
      },
      optionalValues: ['score', 'lesson_title'],
      actionUrl: fields.exerciseLink,
      ctaLabel: fields.score ? copy.ctaWhenScored : undefined,
      branding: fields.branding,
      context
    });
  }
});
