import * as z from 'zod';

/** Relative paths stay inside the asset's own prefix — no traversal, no absolutes. */
const ZRelativeOutputPath = z
  .string()
  .min(1)
  .max(200)
  .refine((value) => !value.startsWith('/') && !value.includes('..') && !value.includes('\\'), {
    message: 'Output path must be relative to the asset prefix'
  });

export const ZEncoderPresignOutputs = z.object({
  paths: z.array(ZRelativeOutputPath).min(1).max(2000)
});
export type TEncoderPresignOutputs = z.infer<typeof ZEncoderPresignOutputs>;

export const ZEncoderFinalize = z.object({
  manifestPath: ZRelativeOutputPath.describe('Master playlist, relative to the asset prefix.'),
  audioPath: ZRelativeOutputPath.nullable().describe('Shared audio rendition playlist, when the source had audio.'),
  renditions: z.array(z.string().min(1)).min(1).describe('Rendition names in the master, e.g. ["p360","p720"].'),
  sourceWidth: z.number().int().positive(),
  sourceHeight: z.number().int().positive(),
  durationSeconds: z.number().nonnegative()
});
export type TEncoderFinalize = z.infer<typeof ZEncoderFinalize>;

export const ZEncoderFail = z.object({
  reason: z.string().min(1).max(2000)
});
export type TEncoderFail = z.infer<typeof ZEncoderFail>;

export const ZEncoderProgress = z.object({
  percent: z.number().int().min(0).max(100),
  stage: z.string().min(1).max(60)
});
export type TEncoderProgress = z.infer<typeof ZEncoderProgress>;
