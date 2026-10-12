import * as z from 'zod';

export const SCORM_COMPLETION_RULES = ['auto', 'completed', 'passed', 'score'] as const;
export type TScormCompletionRule = (typeof SCORM_COMPLETION_RULES)[number];

export const SCORM_LAUNCH_MODES = ['embedded', 'window'] as const;
export type TScormLaunchMode = (typeof SCORM_LAUNCH_MODES)[number];

export const ZScormSettings = z
  .object({
    completionRule: z.enum(SCORM_COMPLETION_RULES).default('auto'),
    minScorePercent: z.number().int().min(0).max(100).nullish(),
    allowRetakes: z.boolean().default(false),
    launchMode: z.enum(SCORM_LAUNCH_MODES).default('embedded')
  })
  .superRefine((settings, ctx) => {
    if (settings.completionRule === 'score' && settings.minScorePercent == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['minScorePercent'],
        message: 'Minimum score is required when the completion rule is a minimum score'
      });
    }
  });
export type TScormSettings = z.infer<typeof ZScormSettings>;

export const ZRuntimeTokenParam = z.object({
  launchToken: z.string().min(1)
});
export type TRuntimeTokenParam = z.infer<typeof ZRuntimeTokenParam>;

export const SCORM_SESSION_EVENT_KINDS = [
  'launch',
  'initialize',
  'commit',
  'terminate',
  'beacon',
  'error',
  'not_initialized'
] as const;
export type TScormSessionEventKind = (typeof SCORM_SESSION_EVENT_KINDS)[number];

export const SCORM_PLAYER_EVENT_KINDS = ['initialize', 'not_initialized', 'error'] as const;
export type TScormPlayerEventKind = (typeof SCORM_PLAYER_EVENT_KINDS)[number];

/**
 * Player-reported run-time event. Only player-observed kinds are accepted;
 * launch, commit, terminate and beacon are derived server-side.
 */
export const ZScormRuntimeEvent = z.object({
  kind: z.enum(SCORM_PLAYER_EVENT_KINDS),
  detail: z.record(z.string(), z.unknown()).default({})
});
export type TScormRuntimeEvent = z.infer<typeof ZScormRuntimeEvent>;

/**
 * Run-time commit envelope. Accepts the sequence field scorm-again sends
 * (`commitSequence`) and the legacy `seq` alias. Semantic validation lives
 * in `normalizeCommitCmi`; this only guards the transport shape.
 */
export const ZScormCommit = z
  .object({
    seq: z.coerce.number().int().min(0).optional(),
    commitSequence: z.coerce.number().int().min(0).optional(),
    cmi: z.record(z.string(), z.unknown()),
    terminate: z.boolean().optional().default(false),
    beacon: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (value.seq === undefined && value.commitSequence === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A commit sequence is required',
        path: ['commitSequence']
      });
    }
  });
export type TScormCommit = z.infer<typeof ZScormCommit>;
