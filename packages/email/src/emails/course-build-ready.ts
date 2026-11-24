import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { escapeHtml } from '../utils/functions/email-helpers';

/**
 * System email, sent once when a website course build ends: the courses it created for the organisation, unpublished,
 * for its admin to review.
 */
export const courseBuildReadyEmail = defineEmail({
  id: 'courseBuildReady',
  subject: 'Your new courses are ready to review',
  schema: z.object({
    orgName: z.string().min(1),
    sourceSite: z.string().min(1),
    courses: z.array(z.object({ title: z.string().min(1), url: z.url() })).min(1)
  }),
  render: (fields) => {
    const orgName = escapeHtml(fields.orgName);
    const sourceSite = escapeHtml(fields.sourceSite);
    const items = fields.courses
      .map((course) => `<li><a href="${escapeHtml(course.url)}">${escapeHtml(course.title)}</a></li>`)
      .join('');
    const content = `
      <p>Hi there,</p>
      <p>We built these courses for <strong>${orgName}</strong> from ${sourceSite}. They are in your workspace, unpublished, so you can review them before your learners see them.</p>
      <ul>${items}</ul>
      <div>
        <a class="button" href="${escapeHtml(fields.courses[0].url)}">Review the first course</a>
      </div>
      <p>Every lesson links to the page it was written from.</p>
    `;

    return getDefaultTemplate(content);
  }
});
