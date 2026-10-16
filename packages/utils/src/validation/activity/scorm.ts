import * as z from 'zod';

import {
  SCORM_COMPLETION_MODULES,
  SCORM_COMPLETION_RULES,
  SCORM_MODULE_ORDERS,
  SCORM_SESSION_EVENT_KINDS
} from '../../constants/activity';

export { SCORM_COMPLETION_MODULES, SCORM_COMPLETION_RULES, SCORM_MODULE_ORDERS, SCORM_SESSION_EVENT_KINDS };
export type {
  TScormCompletionModules,
  TScormCompletionRule,
  TScormModuleOrder,
  TScormSessionEventKind
} from '../../constants/activity';

export const SCORM_SESSION_EVENT_DETAIL_MAX_BYTES = 2048;
export const SCORM_SESSION_EVENT_USER_AGENT_MAX_LENGTH = 512;

export const ZScormSessionEventDetail = z
  .record(z.string(), z.unknown())
  .default({})
  .superRefine((detail, ctx) => {
    if (JSON.stringify(detail).length > SCORM_SESSION_EVENT_DETAIL_MAX_BYTES) {
      ctx.addIssue({
        code: 'custom',
        message: `Detail must not exceed ${SCORM_SESSION_EVENT_DETAIL_MAX_BYTES} bytes`
      });
    }
  });

export const ZScormSessionEventUserAgent = z.string().max(SCORM_SESSION_EVENT_USER_AGENT_MAX_LENGTH).nullish();

export const ZScormSettings = z
  .object({
    completionRule: z.enum(SCORM_COMPLETION_RULES).default('auto'),
    minScorePercent: z.number().int().min(0).max(100).nullish(),
    allowRetakes: z.boolean().default(false),
    moduleOrder: z.enum(SCORM_MODULE_ORDERS).default('free'),
    completionModules: z.enum(SCORM_COMPLETION_MODULES).default('all')
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
