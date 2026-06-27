import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const programGoalReminderEmail = defineEmail({
  id: 'programGoalReminder',
  subject: 'Reminder: a program goal is due soon',
  schema: z.object({
    orgName: z.string().min(1),
    programName: z.string().min(1),
    goalTitle: z.string().min(1),
    daysUntilDue: z.number().int(),
    completedCount: z.number().int(),
    requiredCount: z.number().int(),
    loginUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const dueLine =
      fields.daysUntilDue <= 0
        ? `<p>This goal is now <strong>overdue</strong>.</p>`
        : fields.daysUntilDue === 1
          ? `<p>This goal is due <strong>tomorrow</strong>.</p>`
          : `<p>This goal is due in <strong>${fields.daysUntilDue} days</strong>.</p>`;

    const progress = `${fields.completedCount} of ${fields.requiredCount} courses completed`;

    const content = `
      <p>Hi there,</p>
      <p>This is a reminder that the goal <strong>${fields.goalTitle}</strong> in your program <strong>${fields.programName}</strong> at ${fields.orgName} needs your attention.</p>
      ${dueLine}
      <p>Your progress so far: <strong>${progress}</strong>.</p>
      <p><a href="${fields.loginUrl}">Open the LMS</a> to keep going.</p>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
