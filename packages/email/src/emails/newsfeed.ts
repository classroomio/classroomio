import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const newsfeedPostEmail = defineEmail({
  id: 'newsfeedPost',
  subject: 'New post in course',
  schema: z.object({
    courseTitle: z.string().min(1),
    teacherName: z.string().min(1),
    content: z.string().min(1),
    postLink: z.url(),
    orgName: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>${fields.teacherName} made a post in a course you are taking: ${fields.courseTitle}.</p>
      <div style="font-style: italic; margin-top: 10px;">${fields.content}</div>
      <div>
        <a class="button" href="${fields.postLink}">View post</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});

export const newsfeedCommentEmail = defineEmail({
  id: 'newsfeedComment',
  subject: 'News feed comment',
  schema: z.object({
    courseTitle: z.string().min(1),
    comment: z.string().min(1),
    postLink: z.url(),
    orgName: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
      <p>A student left you a comment on your newsfeed post</p>
      <div style="font-style: italic; margin-top: 10px;">${fields.comment}</div>
      <div>
        <a class="button" href="${fields.postLink}">View comment</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
