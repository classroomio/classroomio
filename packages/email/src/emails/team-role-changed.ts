import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';
import { escapeHtml } from '../utils/functions/email-helpers';

export const teamRoleChangedEmail = defineEmail({
  id: 'teamRoleChanged',
  subject: (fields) => `Your role in ${fields.orgName} has changed`,
  schema: z.object({
    name: z.string().min(1),
    orgName: z.string().min(1),
    previousRoleName: z.string().min(1),
    newRoleName: z.string().min(1),
    changedByName: z.string().min(1).optional(),
    changedAt: z.iso.datetime(),
    dashboardUrl: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const name = escapeHtml(fields.name);
    const orgName = escapeHtml(fields.orgName);
    const previousRoleName = escapeHtml(fields.previousRoleName);
    const newRoleName = escapeHtml(fields.newRoleName);
    const dashboardUrl = escapeHtml(fields.dashboardUrl);
    const changedAt = escapeHtml(`${fields.changedAt.slice(0, 16).replace('T', ' ')} UTC`);

    const changedByLine = fields.changedByName
      ? `<p><strong>${escapeHtml(fields.changedByName)}</strong> changed your role in <strong>${orgName}</strong>.</p>`
      : `<p>An admin changed your role in <strong>${orgName}</strong>.</p>`;

    const content = `
      <p>Hi ${name},</p>
      ${changedByLine}
      <p><strong>Previous role:</strong> ${previousRoleName}<br /><strong>New role:</strong> ${newRoleName}<br /><strong>When:</strong> ${changedAt}</p>
      <p>Your access to courses and settings now follows your new role. If you were not expecting this change, contact an admin of ${orgName}.</p>
      <div>
        <a class="button" href="${dashboardUrl}">Open dashboard</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
