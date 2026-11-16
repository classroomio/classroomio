import * as z from 'zod';

export const ZPluginQuestionGradingStrategy = z.string().min(1);

export const ZPluginQuestionGradingConfig = z
  .object({
    strategy: ZPluginQuestionGradingStrategy,
    expectedAnswer: z.unknown().optional(),
    matchPattern: z.string().optional(),
    tolerance: z.number().optional(),
    hiddenTests: z.array(z.record(z.string(), z.unknown())).optional(),
    timeoutMs: z.number().int().min(1).max(30000).optional()
  })
  .passthrough();

export const ZPluginQuestionSettingsEnvelope = z.object({
  pluginId: z.string().min(1),
  installationId: z.string().min(1),
  pluginVersion: z.string().min(1),
  artifactDigest: z.string().min(1),
  contributionId: z.string().min(1),
  configVersion: z.number().int().min(1),
  publicConfig: z.record(z.string(), z.unknown()),
  gradingConfig: ZPluginQuestionGradingConfig.optional()
});

export type TPluginQuestionSettingsEnvelope = z.infer<typeof ZPluginQuestionSettingsEnvelope>;

export const ZPluginCustomAnswer = z.object({
  type: z.literal('PLUGIN_CUSTOM'),
  pluginId: z.string().min(1),
  contributionId: z.string().min(1),
  configVersion: z.number().int().min(1),
  value: z.unknown()
});

export type TPluginCustomAnswer = z.infer<typeof ZPluginCustomAnswer>;
