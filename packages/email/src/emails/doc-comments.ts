import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const noteCommentMentionEmail = defineEmail({
  id: 'noteCommentMention',
  subject: 'You were mentioned in a note comment',
  schema: z.object({
    docTitle: z.string().min(1),
    authorName: z.string().min(1),
    comment: z.string().min(1),
    noteLink: z.url(),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>${fields.authorName} mentioned you in a comment on <strong>${fields.docTitle}</strong>.</p>
      <div style="font-style: italic; margin-top: 10px;">${fields.comment}</div>
      <div>
        <a class="button" href="${fields.noteLink}">View comment</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});

export const noteCommentReplyEmail = defineEmail({
  id: 'noteCommentReply',
  subject: 'New reply on a note comment thread',
  schema: z.object({
    docTitle: z.string().min(1),
    authorName: z.string().min(1),
    comment: z.string().min(1),
    noteLink: z.url(),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>${fields.authorName} replied in a comment thread on <strong>${fields.docTitle}</strong>.</p>
      <div style="font-style: italic; margin-top: 10px;">${fields.comment}</div>
      <div>
        <a class="button" href="${fields.noteLink}">View thread</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
