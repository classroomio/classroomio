import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const studentCohortWelcomeEmail = defineEmail({
  id: 'studentCohortWelcome',
  subject: (fields, context) => renderStudentEmailSubject('studentCohortWelcome', fields, context),
  schema: z.object({
    orgName: z.string().min(1),
    cohortName: z.string().min(1),
    loginUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'studentCohortWelcome',
      values: { org_name: fields.orgName, cohort_name: fields.cohortName },
      actionUrl: fields.loginUrl,
      branding: fields.branding,
      context
    })
});
