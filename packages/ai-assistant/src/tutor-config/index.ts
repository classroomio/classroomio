/**
 * Shared AI tutor configuration shape.
 *
 * Lives in @cio/ai-assistant so the API, the dashboard, and validation
 * layers reference one source of truth. Org-level defaults and per-course
 * overrides both conform to (partials of) `AiTutorSettings`.
 */

export const TUTOR_PERSONA_IDS = ['friendly', 'formal', 'encouraging', 'socratic', 'custom'] as const;
export type TutorPersonaId = (typeof TUTOR_PERSONA_IDS)[number];

export const TUTOR_RESPONSE_LENGTHS = ['short', 'medium', 'long'] as const;
export type TutorResponseLength = (typeof TUTOR_RESPONSE_LENGTHS)[number];

export const TUTOR_ASSESSMENT_MODES = ['direct_answer', 'hint_only', 'block_during_exercise'] as const;
export type TutorAssessmentMode = (typeof TUTOR_ASSESSMENT_MODES)[number];

export const TUTOR_CODE_POLICIES = ['allowed', 'hints_only', 'forbidden'] as const;
export type TutorCodePolicy = (typeof TUTOR_CODE_POLICIES)[number];

export const TUTOR_GROUNDING_SCOPES = ['lesson', 'course', 'workspace'] as const;
export type TutorGroundingScope = (typeof TUTOR_GROUNDING_SCOPES)[number];

export interface AiTutorEscalation {
  enabled: boolean;
  email: string;
}

export interface AiTutorSettings {
  enabled: boolean;
  persona: TutorPersonaId;
  customPersona: string;
  responseLength: TutorResponseLength;
  welcomeMessage: string;
  disclaimerFooter: string;
  thingsToSay: string;
  thingsNotToSay: string;
  forbiddenTopics: string[];
  groundingScope: TutorGroundingScope;
  requireCitations: boolean;
  assessmentMode: TutorAssessmentMode;
  revealSolutionsAfterAttempts: number;
  codePolicy: TutorCodePolicy;
  blockOffTopic: boolean;
  profanityFilter: boolean;
  escalation: AiTutorEscalation;
}

export const defaultAiTutorSettings: AiTutorSettings = {
  enabled: true,
  persona: 'encouraging',
  customPersona: '',
  responseLength: 'medium',
  welcomeMessage: '',
  disclaimerFooter: 'I am an AI tutor, not your instructor.',
  thingsToSay: '',
  thingsNotToSay: '',
  forbiddenTopics: [],
  groundingScope: 'course',
  requireCitations: true,
  assessmentMode: 'hint_only',
  revealSolutionsAfterAttempts: 3,
  codePolicy: 'hints_only',
  blockOffTopic: true,
  profanityFilter: true,
  escalation: { enabled: false, email: '' }
};

/**
 * Per-learner fair-use cap: monthly tutor messages, flat across all tiers.
 * See `prd/ai-tutor-fair-use/README.md` — Phase 1 lands the counter; Phase 3
 * flips enforcement on via `AI_TUTOR_CAP_ENFORCED`.
 */
export const STUDENT_TUTOR_MONTHLY_CAP = 100;

/**
 * 80% of cap is the "approaching" threshold used in admin summaries.
 */
export const STUDENT_TUTOR_APPROACHING_THRESHOLD = 0.8;

/** Merge a partial override into a fully-resolved settings record. */
export function mergeAiTutorSettings(
  base: AiTutorSettings,
  override: Partial<AiTutorSettings> | null | undefined
): AiTutorSettings {
  if (!override) return base;

  return {
    ...base,
    ...override,
    escalation: { ...base.escalation, ...(override.escalation ?? {}) }
  };
}
