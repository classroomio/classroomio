import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';
import { renderStudentEmail, renderStudentEmailSubject } from '../core/student-email';

export const newsfeedPostEmail = defineEmail({
  id: 'newsfeedPost',
  subject: (fields, context) => renderStudentEmailSubject('newsfeedPost', fields, context),
  schema: z.object({
    courseTitle: z.string().min(1),
    teacherName: z.string().min(1),
    content: z.string().min(1),
    postLink: z.url(),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields, context) =>
    renderStudentEmail({
      id: 'newsfeedPost',
      values: {
        org_name: fields.orgName,
        course_name: fields.courseTitle,
        teacher_name: fields.teacherName
      },
      trustedHtml: { post_content: `<div style="font-style:italic;margin-top:10px;">${fields.content}</div>` },
      actionUrl: fields.postLink,
      branding: fields.branding,
      context
    })
});

export const newsfeedCommentEmail = defineEmail({
  id: 'newsfeedComment',
  subject: 'News feed comment',
  schema: z.object({
    courseTitle: z.string().min(1),
    comment: z.string().min(1),
    postLink: z.url(),
    orgName: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>A student left you a comment on your newsfeed post</p>
      <div style="font-style: italic; margin-top: 10px;">${fields.comment}</div>
      <div>
        <a class="button" href="${fields.postLink}">View comment</a>
      </div>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
