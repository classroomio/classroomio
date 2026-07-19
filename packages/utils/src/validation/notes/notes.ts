import * as z from 'zod';
import { ZSlug } from '../shared/slug';

export const NOTE_ORIGINS = ['workspace', 'lesson_capture'] as const;
export const NOTE_VISIBILITIES = ['private', 'team', 'public'] as const;
export const NOTE_SHARE_VISIBILITIES = ['private', 'team', 'public'] as const;

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
  videoAnchors: z.array(ZNoteVideoAnchor).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const ZUpdateNote = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  videoAnchors: z.array(ZNoteVideoAnchor).optional(),
  isPinned: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  coverImageUrl: z.string().max(2048).nullable().optional()
});

export const ZNoteShareGrant = z.object({
  profileId: z.string().uuid(),
  permission: z.enum(['read', 'write'])
});

export const ZReplaceNoteShares = z.object({
  grants: z.array(ZNoteShareGrant).max(100).default([])
});

export const ZCreateNoteFromCourseTemplate = z.object({
  organizationId: z.string().uuid(),
  templateId: z.enum([
    'cohort_bootcamp',
    'self_paced_video',
    'single_workshop',
    'semester_course',
    'certification_prep',
    'blank_course'
  ])
});

export const ZNoteTagAssignment = z.object({
  tagIds: z.array(z.uuid()).max(100).default([])
});

export const ZUpdateNoteVisibility = z.object({
  visibility: ZNoteShareVisibility,
  slug: ZSlug.optional()
});

export const ZConvertNoteCourseLesson = z.object({
  title: z.string().min(1).max(500),
  content: z.string()
});

export const ZConvertNoteCourseSection = z.object({
  title: z.string().min(1).max(500),
  lessons: z.array(ZConvertNoteCourseLesson).max(200)
});

export const ZConvertNoteToCourse = z.object({
  courseTitle: z.string().min(1).max(500),
  sections: z.array(ZConvertNoteCourseSection).max(50),
  unsectionedLessons: z.array(ZConvertNoteCourseLesson).max(200)
});

export const ZPublicNoteBySlugParam = z.object({
  noteSlug: ZSlug
});

export const ZPublicNoteQuery = z.object({
  siteName: z.string().min(1).max(200)
});

export type TListNotesQuery = z.infer<typeof ZListNotesQuery>;
export type TCreateNoteFromTemplate = z.infer<typeof ZCreateNoteFromTemplate>;
export type TCreateNote = z.infer<typeof ZCreateNote>;
export type TUpdateNote = z.infer<typeof ZUpdateNote>;
export type TNoteTagAssignment = z.infer<typeof ZNoteTagAssignment>;
export type TReplaceNoteShares = z.infer<typeof ZReplaceNoteShares>;
export type TNoteShareGrant = z.infer<typeof ZNoteShareGrant>;
export type TCreateNoteFromCourseTemplate = z.infer<typeof ZCreateNoteFromCourseTemplate>;
export type TUpdateNoteVisibility = z.infer<typeof ZUpdateNoteVisibility>;
export type TConvertNoteToCourse = z.infer<typeof ZConvertNoteToCourse>;
export type TPublicNoteBySlugParam = z.infer<typeof ZPublicNoteBySlugParam>;
export type TPublicNoteQuery = z.infer<typeof ZPublicNoteQuery>;
export type TNoteListScope = z.infer<typeof ZNoteListScope>;
export type TNoteShareVisibility = z.infer<typeof ZNoteShareVisibility>;
export type TNoteVideoAnchor = z.infer<typeof ZNoteVideoAnchor>;
export type TNoteOrigin = z.infer<typeof ZNoteOrigin>;
