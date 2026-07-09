import * as z from 'zod';

export const NOTE_ORIGINS = ['workspace', 'lesson_capture'] as const;
export const NOTE_VISIBILITIES = ['private', 'team', 'public'] as const;
export const NOTE_SHARE_VISIBILITIES = ['private', 'team'] as const;

export const ZNoteVideoAnchor = z.object({
  assetId: z.string().uuid(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0).optional(),
  label: z.string().max(32).optional()
});

export const ZNoteOrigin = z.enum(NOTE_ORIGINS);
export const ZNoteVisibility = z.enum(NOTE_VISIBILITIES);
export const ZNoteShareVisibility = z.enum(NOTE_SHARE_VISIBILITIES);
export const ZNoteListScope = z.enum(['mine', 'team', 'all']);

export const ZListNotesQuery = z.object({
  organizationId: z.string().uuid(),
  origin: ZNoteOrigin.optional(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  tagId: z.string().uuid().optional(),
  scope: ZNoteListScope.default('mine'),
  isTemplate: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true'))
});

export const ZCreateNoteFromTemplate = z.object({
  organizationId: z.string().uuid(),
  templateNoteId: z.string().uuid()
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

export const ZUpdateNoteVisibility = z.object({
  visibility: ZNoteShareVisibility
});

export type TListNotesQuery = z.infer<typeof ZListNotesQuery>;
export type TCreateNoteFromTemplate = z.infer<typeof ZCreateNoteFromTemplate>;
export type TCreateNote = z.infer<typeof ZCreateNote>;
export type TUpdateNote = z.infer<typeof ZUpdateNote>;
export type TNoteTagAssignment = z.infer<typeof ZNoteTagAssignment>;
export type TUpdateNoteVisibility = z.infer<typeof ZUpdateNoteVisibility>;
export type TNoteListScope = z.infer<typeof ZNoteListScope>;
export type TNoteShareVisibility = z.infer<typeof ZNoteShareVisibility>;
export type TNoteVideoAnchor = z.infer<typeof ZNoteVideoAnchor>;
export type TNoteOrigin = z.infer<typeof ZNoteOrigin>;
