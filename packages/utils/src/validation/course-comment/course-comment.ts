import * as z from 'zod';

import { COURSE_COMMENT_BODY_MAX_LENGTH, COURSE_COMMENT_MAX_MENTIONS } from '../../constants/course-comment';
import { NOTIFICATION_PAGE_MAX_LIMIT } from '../../constants/notification';
import { areMentionSpansValid } from '../../functions/course-comment-mentions';
import { ZCourseCommentAnchorInput } from './anchor';

export const ZCourseCommentMention = z.object({
  profileId: z.uuid(),
  start: z.number().int().min(0),
  end: z.number().int().min(1)
});

const ZCommentFields = z.object({
  body: z.string().min(1).max(COURSE_COMMENT_BODY_MAX_LENGTH),
  mentions: z.array(ZCourseCommentMention).max(COURSE_COMMENT_MAX_MENTIONS).default([])
});

type TCommentFields = z.infer<typeof ZCommentFields>;

function withCommentRules<TSchema extends z.ZodType<TCommentFields>>(schema: TSchema) {
  return schema
    .refine((comment) => comment.body.trim().length > 0, { message: 'Comment cannot be empty', path: ['body'] })
    .refine((comment) => areMentionSpansValid(comment.body, comment.mentions), {
      message: 'Invalid mention span',
      path: ['mentions']
    });
}

export const ZCourseCommentWrite = withCommentRules(ZCommentFields);
export type TCourseCommentWrite = z.infer<typeof ZCourseCommentWrite>;

export const ZCreateCourseCommentThread = withCommentRules(
  ZCommentFields.extend({ anchor: ZCourseCommentAnchorInput })
);
export type TCreateCourseCommentThread = z.infer<typeof ZCreateCourseCommentThread>;

export const ZCourseCommentCourseParam = z.object({ courseId: z.uuid() });

export const ZCourseCommentThreadParam = ZCourseCommentCourseParam.extend({ threadId: z.uuid() });
export type TCourseCommentThreadParam = z.infer<typeof ZCourseCommentThreadParam>;

export const ZCourseCommentParam = ZCourseCommentThreadParam.extend({ commentId: z.uuid() });
export type TCourseCommentParam = z.infer<typeof ZCourseCommentParam>;

export const ZListCourseCommentThreadsQuery = z.object({
  status: z.enum(['open', 'resolved', 'all']).default('open')
});
export type TListCourseCommentThreadsQuery = z.infer<typeof ZListCourseCommentThreadsQuery>;

export const ZCourseCommentPresenceCursor = z.object({
  blockId: z.uuid().nullable(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});
export type TCourseCommentPresenceCursor = z.infer<typeof ZCourseCommentPresenceCursor>;

export const ZCourseCommentPresenceTyping = z.object({
  threadId: z.uuid().nullable(),
  text: z.string().max(COURSE_COMMENT_BODY_MAX_LENGTH)
});
export type TCourseCommentPresenceTyping = z.infer<typeof ZCourseCommentPresenceTyping>;

export const ZCourseCommentPresence = z.object({
  pageId: z.uuid(),
  cursor: ZCourseCommentPresenceCursor.nullable(),
  typing: ZCourseCommentPresenceTyping.nullable()
});
export type TCourseCommentPresence = z.infer<typeof ZCourseCommentPresence>;

export const ZNotificationListQuery = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(NOTIFICATION_PAGE_MAX_LIMIT).default(20)
});
export type TNotificationListQuery = z.infer<typeof ZNotificationListQuery>;

export const ZNotificationParam = z.object({ notificationId: z.uuid() });
