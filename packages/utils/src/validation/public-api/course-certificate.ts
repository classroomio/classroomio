import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiCertificateTemplateId = z.enum(['classique', 'brutalist', 'noir', 'poster', 'minimal']);

export const ZPublicApiCertificateSignatory = z.object({
  name: z.string().max(80).default(''),
  role: z.string().max(80).default(''),
  enabled: z.boolean().default(true),
  signatureUrl: z.url().optional()
});

export const ZPublicApiCertificateDesign = z.object({
  templateId: ZPublicApiCertificateTemplateId,
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
  isDownloadable: z
    .boolean()
    .optional()
    .describe('Controls learner downloads only; the download endpoint works either way.'),
  theme: z.string().min(1).max(40).optional(),
  design: ZPublicApiCertificateDesign.optional().describe(
    'Replaces the whole stored design instead of merging, so read it first and send the full object. Sent without theme, it sets theme to design.templateId, as the dashboard editor does.'
  ),
  deadline: ZPublicApiCertificateDeadline.nullable()
    .optional()
    .describe('ISO 8601 datetime with a timezone, for example 2026-12-31T23:59:59Z. Send null to clear it.'),
  threshold: z.number().int().min(0).max(100).optional(),
  emailMessage: z.string().max(5000).nullable().optional().describe('Send null to clear it.')
});

export const PUBLIC_API_CERTIFICATE_FIELDS = Object.keys(ZPublicApiCertificateSettingsFields.shape) as Array<
  keyof typeof ZPublicApiCertificateSettingsFields.shape
>;

export const ZPublicApiUpdateCourseCertificate = ZPublicApiCertificateSettingsFields.refine(
  (data) => PUBLIC_API_CERTIFICATE_FIELDS.some((field) => data[field] !== undefined),
  { message: 'Provide at least one certificate field to update' }
);
export type TPublicApiUpdateCourseCertificate = z.infer<typeof ZPublicApiUpdateCourseCertificate>;

export const ZPublicApiListCourseCertificatesQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional().describe('Matches name or email.')
});
export type TPublicApiListCourseCertificatesQuery = z.infer<typeof ZPublicApiListCourseCertificatesQuery>;

export const ZPublicApiCourseCertificateMemberParam = ZPublicApiCourseParam.extend({
  memberId: z.string().uuid().describe('The memberId returned by the issued certificates list.')
});
export type TPublicApiCourseCertificateMemberParam = z.infer<typeof ZPublicApiCourseCertificateMemberParam>;

export const ZPublicApiCertificateFileFormat = z.enum(['pdf', 'png']);
export type TPublicApiCertificateFileFormat = z.infer<typeof ZPublicApiCertificateFileFormat>;

export const ZPublicApiDownloadCourseCertificateQuery = z.object({
  format: ZPublicApiCertificateFileFormat.default('pdf').describe('pdf or png. Default: pdf.')
});
export type TPublicApiDownloadCourseCertificateQuery = z.infer<typeof ZPublicApiDownloadCourseCertificateQuery>;
