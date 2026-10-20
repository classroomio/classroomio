import * as z from 'zod';

export const ZPluginReleaseCandidate = z.object({
  pluginId: z.string().trim().min(3).max(128),
  version: z.string().trim().min(1).max(64),
  artifactDigest: z.string().regex(/^sha256-[0-9a-f]{64}$/, 'Must be a sha256 checksum (sha256-<hex>)'),
  kind: z.enum(['first-party', 'community'])
});
export type TPluginReleaseCandidate = z.infer<typeof ZPluginReleaseCandidate>;

export const ZInternalPluginReleaseRequest = z.object({
  sourceCommit: z.string().regex(/^[0-9a-f]{40}$/i, 'Must be a 40-character git commit SHA'),
  workflowRunUrl: z
    .string()
    .url()
    .regex(
      /^https:\/\/github\.com\/classroomio\/classroomio-plugins\/actions\/runs\/[0-9]+(?:\/attempts\/[0-9]+)?$/,
      'Must be a ClassroomIO plugin release workflow URL'
    ),
  releases: z.array(ZPluginReleaseCandidate).min(1)
});
export type TInternalPluginReleaseRequest = z.infer<typeof ZInternalPluginReleaseRequest>;

export const ZCreateDevelopmentRelease = z.object({
  manifest: z.record(z.string(), z.unknown()),
  artifactDigest: z.string().regex(/^sha256-[0-9a-f]{64}$/, 'Must be a sha256 checksum (sha256-<hex>)'),
  archive: z.string().min(1).max(16_000_000),
  organizationId: z.string().uuid()
});
export type TCreateDevelopmentRelease = z.infer<typeof ZCreateDevelopmentRelease>;
