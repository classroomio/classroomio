import { QUESTION_TYPE_IDS } from '@cio/question-types';

type PartInput = {
  question: string;
  questionTypeId?: number;
  points: number;
  settings?: Record<string, unknown>;
  options?: Array<{ label: string; isCorrect: boolean; settings?: Record<string, unknown> }>;
};

type ExpandedQuestion<Question> = Omit<Question, 'parts'> & { ref?: string; parentRef?: string };

/**
 * Replaces each question that has `parts` with a stem question worth 0 points followed by its parts, linked by
 * `ref` and `parentRef` so they are created in dependency order. Other questions pass through unchanged.
 */
export function expandQuestionParts<Question extends { parts?: PartInput[] }>(
  questions: Question[]
): Array<ExpandedQuestion<Question>> {
  return questions.flatMap((question, index) => {
    const { parts, ...stem } = question;
    if (!parts || parts.length === 0) return [stem];

    const ref = `stem-${index}`;
    const stemQuestion = {
      ...stem,
      questionTypeId: QUESTION_TYPE_IDS.SHORT_ANSWER,
      points: 0,
      options: undefined,
      settings: undefined,
      ref
    };
    const partQuestions = parts.map((part) => ({ ...part, parentRef: ref }));

    return [stemQuestion, ...partQuestions] as Array<ExpandedQuestion<Question>>;
  });
}
