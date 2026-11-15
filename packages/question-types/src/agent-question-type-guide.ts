import { ENABLED_QUESTION_TYPE_REGISTRY } from './question-type-registry';

/** Compact id=typename (label) list for Zod `.describe()` on questionTypeId fields. */
export const ENABLED_QUESTION_TYPE_ID_DESCRIPTION = ENABLED_QUESTION_TYPE_REGISTRY.map(
  (type) => `${type.id}=${type.typename} (${type.label})`
).join(', ');

/** Shared hint for `settings` on create/add/update question tool schemas. */
export const QUESTION_SETTINGS_SCHEMA_HINT =
  'Per-type correct-answer storage. TRUE_FALSE: { correctValue: boolean } with exactly two options labeled True and False (factual statements). THUMBS: open-ended sentiment/poll — no correct answer; omit settings or use {}. NUMERIC: { correctValue: number, tolerance?: number }. STAR: { correctValue: number }. FILL_BLANK: { acceptedAnswers: string[][] } with one array of accepted alternatives per blank, in blank order, e.g. [["1,000", "1000"], ["(2, 3)"]]. WORD_BANK: { correctAnswers: string[], template: string }. MATCHING: { pairs: { left: string, right: string }[] }. MATH_EXPRESSION: { acceptedAnswers: string[] (LaTeX, at least one), compare?: { mode: "equivalent" | "exact_form" | "numeric" | "set", form?: "simplified" | "factored" | "expanded" | "lowest_terms" | "rationalised_denominator" (exact_form only), absoluteTolerance?, relativeTolerance?, significantFigures? (numeric only) }, units?: { unit: string, allowConversion: boolean }, variables?: string[], wrongAnswerFeedback?: { answer: string, feedback: string }[] }. WORKED_SOLUTION: the MATH_EXPRESSION settings plus answerPoints?: number (points for the auto-graded final answer; the rest is graded by hand) and workingInputs?: ("typed" | "drawing" | "photo")[]. NUMERIC also accepts LaTeX or fractions in correctValue ("\\frac{3}{4}") with relativeTolerance and significantFigures. Math convention: wrap math in titles and options in $...$ (and $$...$$ for a display equation), but write acceptedAnswers, correctValue, wrongAnswerFeedback answers and verify values as bare LaTeX with no $ delimiters, the same way the inline_math and block_math lesson blocks hold LaTeX in data-latex. Parameterised questions (NUMERIC, MATH_EXPRESSION, WORKED_SOLUTION): add settings.parameters { variables: { name: one letter (not e or i), type: "int" | "decimal" | "choice", min, max, step, choices? }[], constraints?: string[] such as "a != 0" or "b > a", answerFormula?: string such as "b / a", requireIntegerAnswer?, requireNonzeroAnswer? } and write {{a}}, {{b / a}} or {{answer}} in the title, options, acceptedAnswers and correctValue; each student attempt draws its own numbers and the key is recomputed from the seed. Every key is checked by the Compute Engine before it is saved.';

/** Shared hint for the optional `verify` field on question tool schemas. */
export const QUESTION_VERIFY_SCHEMA_HINT =
  'Optional proof of the answer key, checked by the Compute Engine before saving. For NUMERIC, MATH_EXPRESSION and WORKED_SOLUTION give { expression?: string, equation?: string } in bare LaTeX. expression is the problem as written (for example "\\frac{1}{2}+\\frac{1}{3}") and must equal the key. equation is an equation the key must solve (for example "2x+3=11" with key "x=4"). A key that disagrees is rejected with an error: fix the key, never the check.';

/** Shared hint for `options` on create/add question tool schemas. */
export const QUESTION_OPTIONS_SCHEMA_HINT =
  'Answer options. RADIO and CHECKBOX must have at least 4 plausible options. TRUE_FALSE: exactly 2 options labeled True and False; teacher sets correct answer in settings.correctValue. THUMBS: exactly 2 options (default Yes/No labels, customizable); no correct answer — not auto-graded. Omit or leave empty for NUMERIC, STAR, and WORD_BANK.';

/** Tool-level description fragment for update_questions (dashboard agent + legacy schemas). */
export const UPDATE_QUESTIONS_BINARY_TYPES_HINT =
  'For TRUE_FALSE use settings.correctValue (boolean) with exactly two options labeled True and False. For THUMBS use two customizable options (default Yes/No) with no correct answer — open-ended, not auto-graded.';

/** Tool-level description for add_questions. */
export const ADD_QUESTIONS_TOOL_DESCRIPTION =
  'Add questions to an existing exercise in this course. When get_exercise_details lists in-exercise sections, pass exerciseSectionId so new questions are added to the correct block. For THUMBS (14), use two options (default Yes/No labels, customizable) with no correct answer — open-ended sentiment/poll, not auto-graded. For TRUE_FALSE (4), use True/False labels and settings.correctValue.';

/** Full question-type id guide for MCP exercise tool descriptions. */
export function formatEnabledQuestionTypesGuide(): string {
  const entries = ENABLED_QUESTION_TYPE_REGISTRY.map((type) => `${type.id}=${type.typename} (${type.label})`).join(
    ', '
  );

  return `Supported questionTypeId values: ${entries}. TRUE_FALSE (4) is auto-graded with settings.correctValue (boolean) and True/False labels for factual statements. THUMBS (14) is open-ended (no correct answer, not auto-graded): two customizable Yes/No-style options with thumbs icons for sentiment or poll-style questions. MATH_EXPRESSION (17) is auto-graded by algebraic equivalence from settings.acceptedAnswers; include verify so the engine can confirm the key. WORKED_SOLUTION (18) auto-grades the final answer and leaves the working points for manual grading. HOTSPOT is disabled and must not be used. A question can be a part of a multi-part question by setting parentQuestionId to the id of its stem question; the stem is not answered or graded itself.`;
}

/** Markdown bullet list of enabled question types (for docs). */
export function formatEnabledQuestionTypesMarkdownList(): string {
  return ENABLED_QUESTION_TYPE_REGISTRY.map((type) => `- \`${type.id}\` \`${type.typename}\` - ${type.label}`).join(
    '\n'
  );
}
