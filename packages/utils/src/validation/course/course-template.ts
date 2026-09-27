import * as z from 'zod';

export const ZTemplateListQuery = z.object({
  organizationId: z.string().min(1)
});
export type TTemplateListQuery = z.infer<typeof ZTemplateListQuery>;

export const ZTemplatePreviewParam = z.object({
  templateId: z.string().min(1)
});
export type TTemplatePreviewParam = z.infer<typeof ZTemplatePreviewParam>;

export const ZTemplatePreviewQuery = z.object({
  organizationId: z.string().min(1)
});
export type TTemplatePreviewQuery = z.infer<typeof ZTemplatePreviewQuery>;

export const ZSaveCourseTemplate = z.object({
  title: z.string().min(1)
});
export type TSaveCourseTemplate = z.infer<typeof ZSaveCourseTemplate>;

export const ZCourseTemplateParam = z.object({
  courseId: z.string().min(1)
});
export type TCourseTemplateParam = z.infer<typeof ZCourseTemplateParam>;

export const ZCreateCourseFromTemplate = z.object({
  title: z.string().min(1),
  organizationId: z.string().min(1)
});
export type TCreateCourseFromTemplate = z.infer<typeof ZCreateCourseFromTemplate>;
