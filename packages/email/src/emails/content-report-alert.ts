import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const contentReportAlertEmail = defineEmail({
  id: 'contentReportAlert',
  subject: 'New content report — ClassroomIO',
  schema: z.object({
    reportId: z.string().min(1),
    reason: z.string().min(1),
    details: z.string(),
    targetType: z.string().min(1),
    targetId: z.string().min(1),
    orgName: z.string().min(1),
    orgId: z.string().min(1),
    reporterId: z.string().min(1),
    authorId: z.string(),
    excerpt: z.string(),
    contentUrl: z.string()
  }),
  render: (fields) => {
    const detailsBlock = fields.details ? `<p><strong>Details:</strong> ${escapeHtml(fields.details)}</p>` : '';
    const authorBlock = fields.authorId
      ? `<p><strong>Reported author ID:</strong> ${escapeHtml(fields.authorId)}</p>`
      : '';
    const excerptBlock = fields.excerpt
      ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #d1d5db;color:#374151;">${escapeHtml(fields.excerpt)}</blockquote>`
      : '<p>No text snapshot was captured.</p>';
    const linkBlock = fields.contentUrl
      ? `<div><a class="button" href="${escapeHtml(fields.contentUrl)}">Open reported content</a></div>`
      : '';

    const content = `
      <p>A user reported content on ClassroomIO.</p>
      <p><strong>Report ID:</strong> ${escapeHtml(fields.reportId)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(fields.reason)}</p>
      ${detailsBlock}
      <p><strong>Target:</strong> ${escapeHtml(fields.targetType)} / ${escapeHtml(fields.targetId)}</p>
      <p><strong>Organization:</strong> ${escapeHtml(fields.orgName)} (${escapeHtml(fields.orgId)})</p>
      <p><strong>Reporter ID:</strong> ${escapeHtml(fields.reporterId)}</p>
      ${authorBlock}
      ${excerptBlock}
      ${linkBlock}
      <p>This email is an alert. The stored report in the database is the source of truth.</p>
    `;

    return getDefaultTemplate(content);
  }
});
