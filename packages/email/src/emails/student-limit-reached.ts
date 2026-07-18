import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentLimitReachedEmail = defineEmail({
  id: 'studentLimitReached',
  subject: "You've reached your Free plan student limit",
  schema: z.object({
    orgName: z.string().min(1),
    studentCount: z.number(),
    studentLimit: z.number(),
    upgradeUrl: z.url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p><strong>${fields.orgName}</strong> has reached its Free plan limit of ${fields.studentLimit} students. From now on, new students can't enrol, accept invites, or be added until you upgrade.</p>
      <div>
        <a class="button" href="${fields.upgradeUrl}">Upgrade your plan</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
