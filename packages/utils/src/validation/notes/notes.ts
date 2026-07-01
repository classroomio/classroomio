import * as z from 'zod';

export const NOTE_ORIGINS = ['workspace', 'lesson_capture'] as const;

export const ZNoteVideoAnchor = z.object({
  assetId: z.string().uuid(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0).optional(),
  label: z.string().max(32).optional()
});

export const ZNoteOrigin = z.enum(NOTE_ORIGINS);

export const ZListNotesQuery = z.object({
  organizationId: z.string().uuid(),
  origin: ZNoteOrigin.optional(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  tagId: z.string().uuid().optional()
});

export const ZNoteIdParam = z.object({
  noteId: z.string().uuid()
});

export const ZNoteVersionIdParam = z.object({
  noteId: z.string().uuid(),
  versionId: z.coerce.number().int().positive()
});

export const ZNoteVersionHistoryQuery = z.object({
  endRange: z.coerce.number().int().min(0).max(100).default(9)
});

export const ZCreateNote = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().default(''),
  origin: ZNoteOrigin.default('workspace'),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  videoAnchors: z.array(ZNoteVideoAnchor).optional()
});

export const ZUpdateNote = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  videoAnchors: z.array(ZNoteVideoAnchor).optional()
});

export const ZNoteTagAssignment = z.object({
  tagIds: z.array(z.uuid()).max(100).default([])
});

export type TListNotesQuery = z.infer<typeof ZListNotesQuery>;
export type TCreateNote = z.infer<typeof ZCreateNote>;
export type TUpdateNote = z.infer<typeof ZUpdateNote>;
export type TNoteTagAssignment = z.infer<typeof ZNoteTagAssignment>;
export type TNoteVideoAnchor = z.infer<typeof ZNoteVideoAnchor>;
export type TNoteOrigin = z.infer<typeof ZNoteOrigin>;
