import * as z from 'zod';

import { ZPublicApiCertificateDesign } from './course-certificate';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
export const ZPublicApiCertificateSettingsResponse = z.object({
  isDownloadable: z.boolean().default(false),
  theme: z.string(),
  design: ZPublicApiCertificateDesign,
  deadline: z.iso.datetime({ offset: true }).nullable(),
  threshold: z.number().default(100),
  requiredExerciseId: z.string().uuid().nullable(),
  exerciseMinScorePercent: z.number().nullable(),
  emailMessage: z.string().nullable()
});

export const ZPublicApiIssuedCertificateListItemResponse = z.object({
  memberId: z.string(),
  profileId: z.string().nullable(),
  fullname: z.string().nullable(),
  email: z.string().nullable(),
  certificateEarnedAt: z.string(),
  certificationEmailSentAt: z.string().nullable()
});
