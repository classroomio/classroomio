import * as z from 'zod';

import { defineEmail } from '../send';
import { ZEmailBranding } from '../core/branding';
import { getDefaultTemplate } from '../templates';
import { escapeHtml } from '../utils/functions/email-helpers';

export const studentReportEmail = defineEmail({
  id: 'studentReport',
  subject: (fields) => `${fields.studentName}'s progress report from ${fields.orgName}`,
  schema: z.object({
    orgName: z.string().min(1),
    studentName: z.string().min(1),
    courseName: z.string().min(1),
    periodLabel: z.string().min(1),
    reportUrl: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const orgName = escapeHtml(fields.orgName);
    const studentName = escapeHtml(fields.studentName);
    const courseName = escapeHtml(fields.courseName);
    const periodLabel = escapeHtml(fields.periodLabel);
    const reportUrl = escapeHtml(fields.reportUrl);

    const content = `
      <p>Hello,</p>
      <p><strong>${orgName}</strong> has shared a progress report for <strong>${studentName}</strong> in <strong>${courseName}</strong> (${periodLabel}).</p>
      <p>It shows the skills ${studentName} has mastered, the skills to work on next, and recent scores. The link works without an account and stops working when it expires or the teacher revokes it.</p>
      <div>
        <a class="button" href="${reportUrl}">View the report</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
