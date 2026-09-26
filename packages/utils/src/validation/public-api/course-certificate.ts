import * as z from 'zod';

import { ZCertificateTemplateId } from '../course/course';
import { ZCourseMembersQuery } from '../course/people';
import { ZPublicApiCourseParam } from './course';

export const ZPublicApiCertificateSignatory = z.object({
  name: z.string().max(80).default(''),
  role: z.string().max(80).default(''),
  enabled: z.boolean().default(true),
  signatureUrl: z.url().optional()
});

export const ZPublicApiCertificateDesign = z.object({
  templateId: ZCertificateTemplateId,
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Accent must be a 6-digit hex color' }),
  subtitle: z.string().max(120).optional(),
  descriptionOverride: z.string().max(500).optional(),
  signatories: z.tuple([ZPublicApiCertificateSignatory, ZPublicApiCertificateSignatory]),
  idFormat: z.string().max(40).optional()
});
export type TPublicApiCertificateDesign = z.infer<typeof ZPublicApiCertificateDesign>;

export const ZPublicApiCertificateDeadline = z.iso.datetime({
  offset: true,
  message: 'deadline must be an ISO 8601 datetime with a timezone, e.g. 2026-12-31T23:59:59Z'
});

const ZPublicApiCertificateSettingsFields = z.object({
  isDownloadable: z.boolean().optional(),
  theme: z.string().min(1).max(40).optional(),
  design: ZPublicApiCertificateDesign.optional(),
  deadline: ZPublicApiCertificateDeadline.nullable().optional(),
  threshold: z.number().int().min(0).max(100).optional(),
  requiredExerciseId: z.string().uuid().nullable().optional(),
  exerciseMinScorePercent: z.number().int().min(0).max(100).nullable().optional(),
  emailMessage: z.string().max(5000).nullable().optional()
});

export const PUBLIC_API_CERTIFICATE_FIELDS = Object.keys(ZPublicApiCertificateSettingsFields.shape) as Array<
  keyof typeof ZPublicApiCertificateSettingsFields.shape
>;

export const ZPublicApiUpdateCourseCertificate = ZPublicApiCertificateSettingsFields.refine(
  (data) => PUBLIC_API_CERTIFICATE_FIELDS.some((field) => data[field] !== undefined),
  { message: 'Provide at least one certificate field to update' }
);
export type TPublicApiUpdateCourseCertificate = z.infer<typeof ZPublicApiUpdateCourseCertificate>;

export const ZPublicApiListCourseCertificatesQuery = ZCourseMembersQuery.pick({
  page: true,
  limit: true,
  search: true
});
export type TPublicApiListCourseCertificatesQuery = z.infer<typeof ZPublicApiListCourseCertificatesQuery>;

export const ZPublicApiCourseCertificateMemberParam = ZPublicApiCourseParam.extend({
  memberId: z.string().uuid()
});
export type TPublicApiCourseCertificateMemberParam = z.infer<typeof ZPublicApiCourseCertificateMemberParam>;

export const ZPublicApiCertificateFileFormat = z.enum(['pdf', 'png']);
export type TPublicApiCertificateFileFormat = z.infer<typeof ZPublicApiCertificateFileFormat>;

export const ZPublicApiDownloadCourseCertificateQuery = z.object({
  format: ZPublicApiCertificateFileFormat.default('pdf')
});
export type TPublicApiDownloadCourseCertificateQuery = z.infer<typeof ZPublicApiDownloadCourseCertificateQuery>;
