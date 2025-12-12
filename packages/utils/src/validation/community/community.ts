import * as z from 'zod';

export const ZCommunityQuestions = z.object({
  orgId: z.string().min(1, 'orgId is required')
});

export const ZCommunityQuestion = z.object({
  slug: z.string().min(1, 'slug is required')
});

export const ZNewCommunityQuestion = z.object({
  slug: z.string().min(1, 'slug is required'),
  body: z.string().min(1, 'body is required'),
  title: z.string().min(1, 'title is required'),
  courseId: z.string().min(1, 'courseId is required'),
  organizationId: z.string().min(1, 'organizationId is required'),
  authorProfileId: z.string().min(1, 'authorProfileId is required'),
  votes: z.number().optional()
});

export const ZGetCommunity = z.object({
  id: z.coerce.number()
});

export const ZCommunityQuestionUpdate = z.object({
  title: z.string().min(1, 'title is required'),
  body: z.string().min(1, 'body is required'),
  courseId: z.string().min(1, 'courseId is required')
});

// --- comment
export const ZCommunityCommentDelete = z.object({
  id: z.string().min(1, 'id is required')
});

export const ZGetCommunityCommentQuestionId = z.object({
  questionId: z.coerce.number()
});

export const ZCommunityComment = z.object({
  body: z.string().min(1, 'body is required'),
  authorProfileId: z.string().min(1, 'authorProfileId is required'),
  votes: z.number().optional()
});

export const ZUpvotePost = z.object({
  votes: z.number().optional(),
  isQuestion: z.boolean()
});

export const ZUpvotePostParam = z.object({
  id: z.union([z.string().min(1, 'id is required'), z.number().min(1, 'id is required')])
});

export type TNewCommunityQuestion = z.infer<typeof ZNewCommunityQuestion>;
export type TCommunityQuestions = z.infer<typeof ZCommunityQuestions>;
export type TCommunityQuestion = z.infer<typeof ZCommunityQuestion>;

export type TCommunityComment = z.infer<typeof ZCommunityComment>;
export type TUpvotePost = z.infer<typeof ZUpvotePost>;

export type TCommunityCommentDelete = z.infer<typeof ZCommunityCommentDelete>;
export type TGetCommunity = z.infer<typeof ZGetCommunity>;
