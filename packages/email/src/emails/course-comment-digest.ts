import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';
import { escapeHtml } from '../utils/functions/email-helpers';

const ZCourseCommentDigestItem = z.object({
  actorName: z.string().min(1),
  action: z.enum(['mentioned', 'replied', 'resolved']),
  snippet: z.string().nullable()
});
type TCourseCommentDigestItem = z.infer<typeof ZCourseCommentDigestItem>;

const ACTION_LABELS: Record<TCourseCommentDigestItem['action'], string> = {
  mentioned: 'mentioned you',
  replied: 'replied',
  resolved: 'resolved the thread'
};

function renderItem(item: TCourseCommentDigestItem): string {
  const heading = `<strong>${escapeHtml(item.actorName)}</strong> ${ACTION_LABELS[item.action]}`;
  const snippet = item.snippet
    ? `<br /><span style="color:#4b5563;">&ldquo;${escapeHtml(item.snippet)}&rdquo;</span>`
    : '';

  return `<li style="margin-bottom:12px;">${heading}${snippet}</li>`;
}

export const courseCommentDigestEmail = defineEmail({
  id: 'courseCommentDigest',
  subject: (fields) => `New comments on ${fields.courseTitle}`,
  schema: z.object({
    courseTitle: z.string().min(1),
    locationLabel: z.string().min(1).nullable(),
    items: z.array(ZCourseCommentDigestItem).min(1),
    moreCount: z.number().int().min(0),
    threadUrl: z.url(),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const courseTitle = escapeHtml(fields.courseTitle);
    const location = fields.locationLabel ? ` in <strong>${escapeHtml(fields.locationLabel)}</strong>` : '';
    const moreLine =
      fields.moreCount > 0
        ? `<p>And ${fields.moreCount} more ${fields.moreCount === 1 ? 'update' : 'updates'}.</p>`
        : '';

    const content = `
      <p>Hello,</p>
      <p>There is new activity on a comment thread${location} of <strong>${courseTitle}</strong>:</p>
      <ul style="padding-left:20px;">${fields.items.map(renderItem).join('')}</ul>
      ${moreLine}
      <div>
        <a class="button" href="${escapeHtml(fields.threadUrl)}">Open thread</a>
      </div>
      <p style="color:#6b7280;font-size:12px;">You get this email because you are on the team of this course. You can turn off course comment emails in your notification settings.</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
