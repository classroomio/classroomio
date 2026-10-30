import * as z from 'zod';
import { ZSlug } from '../shared/slug';

export const DOC_ORIGINS = ['organization', 'lesson_capture'] as const;
export const DOC_VISIBILITIES = ['private', 'team', 'public'] as const;
export const DOC_SHARE_VISIBILITIES = ['private', 'team', 'public'] as const;

export const ZDocVideoAnchor = z.object({
  assetId: z.string().uuid(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0).optional(),
  label: z.string().max(32).optional()
});

export const ZDocOrigin = z.enum(DOC_ORIGINS);
export const ZDocVisibility = z.enum(DOC_VISIBILITIES);
export const ZDocShareVisibility = z.enum(DOC_SHARE_VISIBILITIES);
export const ZDocListScope = z.enum(['mine', 'team', 'all']);

export const ZListNotesQuery = z.object({
  organizationId: z.string().uuid(),
  origin: ZDocOrigin.optional(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  tagId: z.string().uuid().optional(),
  scope: ZDocListScope.default('mine'),
  isTemplate: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true'))
});

export const ZCreateNoteFromTemplate = z.object({
  organizationId: z.string().uuid(),
  templateNoteId: z.string().uuid()
});

export const ZDocIdParam = z.object({
  docId: z.string().uuid()
});

export const ZDocVersionIdParam = z.object({
  docId: z.string().uuid(),
  versionId: z.coerce.number().int().positive()
});

export const ZDocVersionHistoryQuery = z.object({
  endRange: z.coerce.number().int().min(0).max(100).default(9)
});

export const ZCreateNote = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().default(''),
  origin: ZDocOrigin.default('organization'),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  videoAnchors: z.array(ZDocVideoAnchor).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const ZUpdateNote = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  videoAnchors: z.array(ZDocVideoAnchor).optional(),
  isPinned: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  coverImageUrl: z.string().max(2048).nullable().optional()
});

export const ZDocShareGrant = z.object({
  profileId: z.string().uuid(),
  permission: z.enum(['read', 'write'])
});

export const ZReplaceNoteShares = z.object({
  grants: z.array(ZDocShareGrant).max(100).default([])
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

export const ZDocTagAssignment = z.object({
  tagIds: z.array(z.uuid()).max(100).default([])
});

export const ZUpdateNoteVisibility = z.object({
  visibility: ZDocShareVisibility,
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

export const ZPublicDocBySlugParam = z.object({
  docSlug: ZSlug
});

export const ZPublicDocQuery = z.object({
  siteName: z.string().min(1).max(200)
});

export type TListNotesQuery = z.infer<typeof ZListNotesQuery>;
export type TCreateNoteFromTemplate = z.infer<typeof ZCreateNoteFromTemplate>;
export type TCreateNote = z.infer<typeof ZCreateNote>;
export type TUpdateNote = z.infer<typeof ZUpdateNote>;
export type TDocTagAssignment = z.infer<typeof ZDocTagAssignment>;
export type TReplaceNoteShares = z.infer<typeof ZReplaceNoteShares>;
export type TDocShareGrant = z.infer<typeof ZDocShareGrant>;
export type TCreateNoteFromCourseTemplate = z.infer<typeof ZCreateNoteFromCourseTemplate>;
export type TUpdateNoteVisibility = z.infer<typeof ZUpdateNoteVisibility>;
export type TConvertNoteToCourse = z.infer<typeof ZConvertNoteToCourse>;
export type TPublicDocBySlugParam = z.infer<typeof ZPublicDocBySlugParam>;
export type TPublicDocQuery = z.infer<typeof ZPublicDocQuery>;
export type TDocListScope = z.infer<typeof ZDocListScope>;
export type TDocShareVisibility = z.infer<typeof ZDocShareVisibility>;
export type TDocVideoAnchor = z.infer<typeof ZDocVideoAnchor>;
export type TDocOrigin = z.infer<typeof ZDocOrigin>;
