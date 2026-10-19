import * as z from 'zod';

export const PLUGIN_RELEASE_LANES = ['first-party', 'private', 'community'] as const;
export type PluginReleaseLane = (typeof PLUGIN_RELEASE_LANES)[number];
export const ZPluginReleaseLane = z.enum(PLUGIN_RELEASE_LANES);

export const PLUGIN_SUBMISSION_STATUSES = [
  'pending_upload',
  'quarantined',
  'in_review',
  'approved',
  'rejected'
] as const;
export type PluginSubmissionStatus = (typeof PLUGIN_SUBMISSION_STATUSES)[number];
export const ZPluginSubmissionStatus = z.enum(PLUGIN_SUBMISSION_STATUSES);

export const ZCreateSubmissionIntent = z.object({
  pluginId: z.string().trim().min(3).max(128),
  version: z.string().trim().min(1).max(64),
  artifactDigest: z.string().regex(/^sha256-[0-9a-f]{64}$/, 'Must be a sha256 checksum (sha256-<hex>)')
});
export type TCreateSubmissionIntent = z.infer<typeof ZCreateSubmissionIntent>;

export const ZCreateDevelopmentRelease = z.object({
  manifest: z.record(z.string(), z.unknown()),
  artifactDigest: z.string().regex(/^sha256-[0-9a-f]{64}$/, 'Must be a sha256 checksum (sha256-<hex>)'),
  archive: z.string().min(1).max(16_000_000),
  organizationId: z.string().uuid()
});
export type TCreateDevelopmentRelease = z.infer<typeof ZCreateDevelopmentRelease>;

export const ZCompleteSubmission = z.object({
  submissionId: z.string().uuid()
});
export type TCompleteSubmission = z.infer<typeof ZCompleteSubmission>;

export const ZReviewSubmission = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().trim().max(1000).optional()
});
export type TReviewSubmission = z.infer<typeof ZReviewSubmission>;

export const ZListSubmissionsQuery = z.object({
  pluginId: z.string().trim().optional(),
  organizationId: z.string().uuid().optional(),
  status: ZPluginSubmissionStatus.optional()
});
export type TListSubmissionsQuery = z.infer<typeof ZListSubmissionsQuery>;
