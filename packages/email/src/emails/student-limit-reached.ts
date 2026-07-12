import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const studentLimitReachedEmail = defineEmail({
  id: 'studentLimitReached',
  subject: "You've reached your Free plan student limit",
  schema: z.object({
    orgName: z.string().min(1),
    studentCount: z.number(),
    studentLimit: z.number(),
    upgradeUrl: z.string().url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p><strong>${fields.orgName}</strong> has reached the ${fields.studentLimit}-student limit on the Free plan (currently ${fields.studentCount} students). New students can't enrol or be invited until you upgrade.</p>
      <div>
        <a class="button" href="${fields.upgradeUrl}">Upgrade your plan</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
