import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentLimitApproachingEmail = defineEmail({
  id: 'studentLimitApproaching',
  subject: "You're approaching your Free plan student limit",
  schema: z.object({
    orgName: z.string().min(1),
    studentCount: z.number(),
    studentLimit: z.number(),
    upgradeUrl: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p><strong>${fields.orgName}</strong> now has ${fields.studentCount} of the ${fields.studentLimit} students included on the Free plan — about halfway to the limit. Once you reach it, new students can't enrol, accept invites, or be added until you upgrade.</p>
      <div>
        <a class="button" href="${fields.upgradeUrl}">Upgrade your plan</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
