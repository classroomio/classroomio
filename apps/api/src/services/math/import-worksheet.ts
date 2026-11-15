import { generateObject } from 'ai';
import { QUESTION_TYPE_IDS } from '@cio/question-types';
import { verifyAnswerKey, type AnswerKeyInput } from '@cio/question-types/math-key-verification';
import {
  ZMathWorksheetModelOutput,
  type TMathImportWorksheetBody,
  type TMathWorksheetModelOutput
} from '@cio/utils/validation/math';
import { getVisionModel, getVisionProviderOptions } from './vision-model';

const SYSTEM_PROMPT = [
  'You turn a photographed or scanned math worksheet into quiz questions.',
  'Extract every question in order. Write the question text as plain text with every piece of math wrapped in $...$ as LaTeX.',
  'Pick the type: MATH_EXPRESSION for an answer that is an expression, equation or list of solutions;',
  'NUMERIC for an answer that is a single number; RADIO for a multiple choice question with one correct option.',
  'Work out the answer yourself and give it as LaTeX in "answer" (RADIO: set correctOptionIndex instead).',
  'Always fill checkExpression (an expression written in the question whose value equals the answer) or checkEquation',
  '(an equation written in the question that the answer solves) when the question has one, copied exactly from the question.',
  'Skip anything that is not a question. Use 1 point per question unless the worksheet shows marks.'
].join(' ');

export type WorksheetQuestionType = TMathWorksheetModelOutput['questions'][number]['type'];

export interface ImportedWorksheetQuestion {
  title: string;
  type: WorksheetQuestionType;
  points: number;
  settings: Record<string, unknown>;
  options: { label: string; isCorrect: boolean }[];
  verified: boolean;
  issues: string[];
}

export interface ImportedWorksheet {
  questions: ImportedWorksheetQuestion[];
  usage: { promptTokens: number; completionTokens: number };
  modelName: string;
}

function stripDollars(text: string): string {
  return text.replace(/^\$+|\$+$/g, '').trim();
}

/**
 * Builds the question a teacher will edit and the engine check on its answer key. A key counts as verified only
 * when the engine confirmed it against an expression or equation from the question; anything else is flagged.
 */
export function buildImportedQuestion(
  extracted: TMathWorksheetModelOutput['questions'][number]
): ImportedWorksheetQuestion {
  const points = extracted.points ?? 1;
  const verify = {
    ...(extracted.checkExpression ? { expression: extracted.checkExpression } : {}),
    ...(extracted.checkEquation ? { equation: extracted.checkEquation } : {})
  };
  const hasCheck = Object.keys(verify).length > 0;

  if (extracted.type === 'RADIO') {
    const labels = extracted.options ?? [];
    const options = labels.map((label, index) => ({ label, isCorrect: index === extracted.correctOptionIndex }));
    const correctLabel = options.find((option) => option.isCorrect)?.label;
    const issues: string[] = [];

    if (!correctLabel) issues.push('No correct option was identified.');
    const input: AnswerKeyInput = {
      questionTypeId: QUESTION_TYPE_IDS.RADIO,
      title: extracted.title,
      optionLabels: labels
    };
    issues.push(...verifyAnswerKey(input));

    if (correctLabel && extracted.checkExpression) {
      const keyed: AnswerKeyInput = {
        questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
        settings: { acceptedAnswers: [stripDollars(correctLabel)] },
        verify: { expression: extracted.checkExpression }
      };
      issues.push(...verifyAnswerKey(keyed));
    }
    if (!hasCheck) issues.push('The engine could not check this answer against the question.');

    return {
      title: extracted.title,
      type: 'RADIO',
      points,
      settings: {},
      options,
      verified: issues.length === 0,
      issues
    };
  }

  const answer = extracted.answer ? stripDollars(extracted.answer) : '';
  const isNumeric = extracted.type === 'NUMERIC';
  const settings: Record<string, unknown> = isNumeric ? { correctValue: answer } : { acceptedAnswers: [answer] };
  const input: AnswerKeyInput = {
    questionTypeId: QUESTION_TYPE_IDS[extracted.type],
    title: extracted.title,
    points,
    settings,
    ...(hasCheck ? { verify } : {})
  };
  const issues = verifyAnswerKey(input);
  if (!hasCheck) issues.push('The engine could not check this answer against the question.');

  return {
    title: extracted.title,
    type: extracted.type,
    points,
    settings,
    options: [],
    verified: issues.length === 0,
    issues
  };
}

/**
 * Reads a worksheet image or PDF with a vision model and returns editable questions, each flagged with whether
 * the Compute Engine confirmed its proposed answer. Nothing is stored.
 */
export async function importWorksheet(document: TMathImportWorksheetBody['document']): Promise<ImportedWorksheet> {
  const { provider, model, modelName } = getVisionModel();
  const part =
    document.mediaType === 'application/pdf'
      ? ({ type: 'file', data: document.data, mediaType: document.mediaType } as const)
      : ({ type: 'image', image: document.data, mediaType: document.mediaType } as const);

  const { object, usage } = await generateObject({
    model,
    schema: ZMathWorksheetModelOutput,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [part] }],
    maxOutputTokens: 8000,
    maxRetries: 0,
    providerOptions: getVisionProviderOptions(provider)
  });

  return {
    questions: object.questions.map(buildImportedQuestion),
    usage: { promptTokens: usage.inputTokens ?? 0, completionTokens: usage.outputTokens ?? 0 },
    modelName
  };
}
