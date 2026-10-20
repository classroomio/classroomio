import * as z from 'zod';

import { ZPublicApiCertificateDesign } from './course-certificate';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
export const ZPublicApiCertificateSettingsResponse = z.object({
  isDownloadable: z
    .boolean()
    .default(false)
    .describe('Controls learner downloads only; the download endpoint works either way.'),
  theme: z.string().describe('Falls back to design.templateId when nothing is stored.'),
  design: ZPublicApiCertificateDesign.describe('The default design when nothing is stored.'),
  deadline: z.iso.datetime({ offset: true }).nullable().describe('null when nothing is stored.'),
  threshold: z.number().default(100),
  requiredExerciseId: z.string().uuid().nullable().describe('null when nothing is stored.'),
  exerciseMinScorePercent: z
    .number()
    .nullable()
    .describe(
      'When nothing is stored: 100 (or the compliance passing score) if a required exercise is set, null otherwise.'
    ),
  emailMessage: z.string().nullable().describe('null when nothing is stored.')
});

export const ZPublicApiIssuedCertificateListItemResponse = z.object({
  memberId: z.string(),
  profileId: z.string().nullable(),
  fullname: z.string().nullable(),
  email: z.string().nullable(),
  certificateEarnedAt: z.string(),
  certificationEmailSentAt: z.string().nullable()
});
