import { z } from 'zod';

/**
 * Zod schema for the resolved AI tutor settings shape.
 *
 * Mirrors `AiTutorSettings` exported from @cio/ai-assistant. Used for org-level
 * settings updates and as the source for `ZCourseAiTutorOverride` (which is the
 * `.partial()` variant plus an `inheritFromOrg` flag).
 */

export const TutorPersonaIdSchema = z.enum(['friendly', 'formal', 'encouraging', 'socratic', 'custom']);
export const TutorResponseLengthSchema = z.enum(['short', 'medium', 'long']);
export const TutorAssessmentModeSchema = z.enum(['direct_answer', 'hint_only', 'block_during_exercise']);
export const TutorCodePolicySchema = z.enum(['allowed', 'hints_only', 'forbidden']);
export const TutorGroundingScopeSchema = z.enum(['lesson', 'course', 'organization']);

const ZAiTutorEscalation = z.object({
  enabled: z.boolean(),
  email: z.union([z.literal(''), z.string().email()])
});

export const ZAiTutorSettings = z.object({
  enabled: z.boolean(),
  persona: TutorPersonaIdSchema,
  customPersona: z.string().max(500).default(''),
  responseLength: TutorResponseLengthSchema,
  welcomeMessage: z.string().max(500).default(''),
  disclaimerFooter: z.string().max(200).default(''),
  thingsToSay: z.string().max(2000).default(''),
  thingsNotToSay: z.string().max(2000).default(''),
  forbiddenTopics: z.array(z.string().min(1).max(60)).max(20).default([]),
  groundingScope: TutorGroundingScopeSchema,
  requireCitations: z.boolean(),
  assessmentMode: TutorAssessmentModeSchema,
  revealSolutionsAfterAttempts: z.number().int().min(0).max(20),
  codePolicy: TutorCodePolicySchema,
  blockOffTopic: z.boolean(),
  profanityFilter: z.boolean(),
  escalation: ZAiTutorEscalation
});

export type TAiTutorSettings = z.infer<typeof ZAiTutorSettings>;

/** Partial — used for org-level PUT and as the base for course override. */
export const ZAiTutorSettingsUpdate = ZAiTutorSettings.partial();
export type TAiTutorSettingsUpdate = z.infer<typeof ZAiTutorSettingsUpdate>;

/** Per-course override: any subset of settings + an inheritance flag. */
export const ZCourseAiTutorOverride = ZAiTutorSettings.partial().extend({
  inheritFromOrg: z.boolean().optional()
});
export type TCourseAiTutorOverride = z.infer<typeof ZCourseAiTutorOverride>;

// ─── Fair-use admin queries ──────────────────────────────────────────────────

export const ZTutorUsagePeriod = z.enum(['current', 'previous', 'last90']);
export type TTutorUsagePeriod = z.infer<typeof ZTutorUsagePeriod>;

export const ZTutorUsageQuery = z.object({
  period: ZTutorUsagePeriod.default('current'),
  search: z.string().max(120).optional(),
  sort: z.enum(['messages', 'tokens', 'capPct']).default('messages'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type TTutorUsageQuery = z.infer<typeof ZTutorUsageQuery>;

export const ZTutorUsageUserParam = z.object({
  userId: z.string().uuid()
});

export type TTutorUsageUserParam = z.infer<typeof ZTutorUsageUserParam>;
