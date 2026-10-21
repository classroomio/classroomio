import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import {
  getStudentEmailCopy,
  getLocalizedDueStatus,
  renderStudentEmail,
  renderStudentEmailSubject
} from '../core/student-email';

export const cohortGoalReminderEmail = defineEmail({
  id: 'cohortGoalReminder',
  subject: (fields, context) => renderStudentEmailSubject('cohortGoalReminder', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    cohortName: z.string().min(1),
    goalTitle: z.string().min(1),
    daysUntilDue: z.number().int(),
    completedCount: z.number().int(),
    requiredCount: z.number().int(),
    loginUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) => {
    const { locale } = getStudentEmailCopy('cohortGoalReminder', context);

    return renderStudentEmail({
      id: 'cohortGoalReminder',
      values: {
        org_name: fields.orgName,
        cohort_name: fields.cohortName,
        goal_title: fields.goalTitle,
        due_status: getLocalizedDueStatus(fields.daysUntilDue, locale),
        completed_count: fields.completedCount,
        required_count: fields.requiredCount
      },
      actionUrl: fields.loginUrl,
      branding: fields.branding,
      context
    });
  }
});
