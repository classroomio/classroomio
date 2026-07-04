import * as z from 'zod';

export const ZNoteCommentAnchor = z.object({
  version: z.literal(1),
  threadId: z.string().uuid(),
  quotedText: z.string().min(1).max(5000),
  prefix: z.string().max(120).optional(),
  suffix: z.string().max(120).optional()
});

export const ZCreateNoteCommentThread = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  anchor: ZNoteCommentAnchor,
  content: z.string()
});

export const ZCreateNoteCommentReply = z.object({
  body: z.string().min(1).max(5000)
});

export const ZUpdateNoteCommentThread = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('resolved'),
    content: z.string()
  }),
  z.object({
    status: z.literal('open'),
    content: z.string().optional()
  })
]);

export const ZUpdateNoteComment = z.object({
  body: z.string().min(1).max(5000)
});

export const ZNoteCommentIdParam = z.object({
  noteId: z.string().uuid(),
  commentId: z.string().uuid()
});

export const ZNoteCommentThreadIdParam = z.object({
  noteId: z.string().uuid(),
  threadId: z.string().uuid()
});

export type TNoteCommentAnchor = z.infer<typeof ZNoteCommentAnchor>;
export type TCreateNoteCommentThread = z.infer<typeof ZCreateNoteCommentThread>;
export type TCreateNoteCommentReply = z.infer<typeof ZCreateNoteCommentReply>;
export type TUpdateNoteCommentThread = z.infer<typeof ZUpdateNoteCommentThread>;
export type TUpdateNoteComment = z.infer<typeof ZUpdateNoteComment>;
