import { ENABLED_QUESTION_TYPE_REGISTRY } from './question-type-registry';

/** Compact id=typename (label) list for Zod `.describe()` on questionTypeId fields. */
export const ENABLED_QUESTION_TYPE_ID_DESCRIPTION = ENABLED_QUESTION_TYPE_REGISTRY.map(
  (type) => `${type.id}=${type.typename} (${type.label})`
).join(', ');

/** Shared hint for `settings` on create/add/update question tool schemas. */
export const QUESTION_SETTINGS_SCHEMA_HINT =
  'Per-type correct-answer storage. TRUE_FALSE: { correctValue: boolean } with exactly two options labeled True and False (factual statements). THUMBS: { correctValue: boolean } with exactly two options labeled Yes and No (agreement, sentiment, or recommendation — not factual true/false). NUMERIC: { correctValue: number, tolerance?: number }. STAR: { correctValue: number }. WORD_BANK: { correctAnswers: string[], template: string }.';

/** Shared hint for `options` on create/add question tool schemas. */
export const QUESTION_OPTIONS_SCHEMA_HINT =
  'Answer options. RADIO and CHECKBOX must have at least 4 plausible options. TRUE_FALSE: exactly 2 options labeled True and False; correct answer in settings.correctValue. THUMBS: exactly 2 options labeled Yes and No; correct answer in settings.correctValue. Omit or leave empty for NUMERIC, STAR, and WORD_BANK.';

/** Tool-level description fragment for update_questions (dashboard agent + legacy schemas). */
export const UPDATE_QUESTIONS_BINARY_TYPES_HINT =
  'For TRUE_FALSE use settings.correctValue (boolean) with exactly two options labeled True and False. For THUMBS use settings.correctValue (boolean) with exactly two options labeled Yes and No (opinion/sentiment, not factual true/false).';

/** Tool-level description for add_questions. */
export const ADD_QUESTIONS_TOOL_DESCRIPTION =
  'Add questions to an existing exercise in this course. When get_exercise_details lists in-exercise sections, pass exerciseSectionId so new questions are added to the correct block. For THUMBS (14), use settings.correctValue with exactly two options labeled Yes and No — use for agreement/sentiment/recommendation, not factual true/false (use TRUE_FALSE/4 for that).';

/** Full question-type id guide for MCP exercise tool descriptions. */
export function formatEnabledQuestionTypesGuide(): string {
  const entries = ENABLED_QUESTION_TYPE_REGISTRY.map((type) => `${type.id}=${type.typename} (${type.label})`).join(
    ', '
  );

  return `Supported questionTypeId values: ${entries}. TRUE_FALSE (4) and THUMBS (14) both use settings.correctValue (boolean) with two options; use True/False for factual statements and Yes/No for agreement or sentiment. MATCHING and HOTSPOT are disabled and must not be used.`;
}

/** Markdown bullet list of enabled question types (for docs). */
export function formatEnabledQuestionTypesMarkdownList(): string {
  return ENABLED_QUESTION_TYPE_REGISTRY.map((type) => `- \`${type.id}\` \`${type.typename}\` - ${type.label}`).join(
    '\n'
  );
}
