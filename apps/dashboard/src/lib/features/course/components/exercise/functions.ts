import { getQuestionAnswerKey, getQuestionTypeKey, questionTypeSupportsOptions } from './question-type-utils';

import { QUESTION_TYPE_KEY } from '@cio/question-types';
import type { Question } from '$features/course/types';
import type { TExerciseUpdate } from '@cio/utils/validation/exercise';
import { toggleConfetti } from '$features/ui/confetti/store';

export const isAnswerCorrect = (options, answer) => {
  return options.some((option) => option.isCorrect && option.value === answer);
};

/*
  GRADING RULES
  Textarea = no validation
  Single = only one should be correct
  Multiple = all should be correct
*/
export function wasCorrectAnswerSelected(currentQuestion: Question, answers, isFinished?: boolean) {
  const questionTypeKey = getQuestionTypeKey(currentQuestion);
  if (!questionTypeSupportsOptions(questionTypeKey)) {
    return true;
  }

  const answer = answers[getQuestionAnswerKey(currentQuestion)];

  const formattedAnswers = typeof answer === 'string' ? [answer] : answer;

  let isCorrect = false;

  if (questionTypeKey === QUESTION_TYPE_KEY.CHECKBOX) {
    // Every correct answer should be in the selected answer
    isCorrect = currentQuestion.options
      .filter((o) => o.isCorrect)
      .every((option) => formattedAnswers?.includes(option.value));
  } else if (questionTypeKey === QUESTION_TYPE_KEY.RADIO) {
    // At least one correct answer should be selected
    isCorrect = formattedAnswers?.some((answer) => isAnswerCorrect(currentQuestion.options, answer));
  }

  if (isCorrect && !isFinished) {
    toggleConfetti();

    setTimeout(toggleConfetti, 100);
  }

  return isCorrect;
}

export function getPropsForQuestion(
  questions: Question[],
  question: Question,
  questionnaireMetaData,
  questionIndex,
  onSubmit,
  onPrevious,
  preview
) {
  const { answers, isFinished } = questionnaireMetaData;
  const isLast = questionIndex === questions.length;
  const isOpenQuesiton = !questionTypeSupportsOptions(getQuestionTypeKey(question));
  const isCorrect = wasCorrectAnswerSelected(question, answers, isFinished);
  const answerKey = getQuestionAnswerKey(question, questionIndex - 1);

  if (!isCorrect && document && document.getElementById('question')) {
    const questionElement = document.getElementById('question');
    // Shake if wrong answer was selected
    questionElement?.classList.toggle('shake');

    setTimeout(() => {
      // Remove so we can trigger animation again
      questionElement?.classList.toggle('shake');
    }, 200);
  }

  return {
    index: questionIndex + '. ',
    title: question.title,
    name: answerKey,
    options: question.options,
    code: question.code,
    defaultValue: isOpenQuesiton ? answers[answerKey] || '' : answers[answerKey] || [],
    onSubmit,
    onPrevious,
    disablePreviousButton: questionIndex === 1,
    isLast,
    isPreview: preview || isFinished,
    isCorrect,
    disabled: (isFinished && isCorrect) || isFinished,
    nextButtonProps: isOpenQuesiton
      ? {
          label: 'Next',
          isActive: true
        }
      : isCorrect
        ? {
            label: isLast ? 'Finish' : 'Next',
            isActive: true,
            disableOptionSelect: true,
            isDisabled: isLast ? false : true // Disable Next button because auto next is enabled
          }
        : {
            label: 'Check',
            isActive: false
          }
  };
}

export function filterOutDeleted(array) {
  return array.filter((item) => !item.deletedAt);
}

/**
 * Transforms questions from the questionnaire format to the API format
 * @param questions - Array of questions from the questionnaire store
 * @param options - Configuration options
 * @param options.shouldFilterEmptyLabels - If true, filters out options with empty labels (for API submission). If false, keeps empty labels (for validation)
 * @param options.shouldIncludeDeleted - If true, includes deleted questions and options with deletedAt flag (for API updates). If false, filters them out (for validation)
 * @returns Transformed questions in API format
 */
export function transformQuestionsToApiFormat(
  questions: Question[],
  options: { shouldFilterEmptyLabels?: boolean; shouldIncludeDeleted?: boolean } = {}
): TExerciseUpdate['questions'] {
  const { shouldFilterEmptyLabels = false, shouldIncludeDeleted = false } = options;
  const getQuestionSettings = (question: Question) => {
    const rawSettings = (question as Question & { settings?: Record<string, unknown> }).settings;
    return rawSettings && typeof rawSettings === 'object' ? { ...rawSettings } : undefined;
  };
  const getOptionSettings = (option: Question['options'][number]) => {
    const rawSettings = (option as Question['options'][number] & { settings?: Record<string, unknown> }).settings;
    return rawSettings && typeof rawSettings === 'object' ? { ...rawSettings } : undefined;
  };

  const normalizeId = (id: unknown) => (id && !isNaN(Number(id)) ? Number(id) : undefined);
  const formatOptions = (opts: Question['options']) => {
    const filtered = shouldIncludeDeleted ? opts || [] : (opts || []).filter((opt) => !opt.deletedAt);

    return filtered
      .filter((opt) => {
        // For validation, keep empty labels. For API, filter them unless deleted
        if (!shouldIncludeDeleted && opt.deletedAt) return false;
        return shouldFilterEmptyLabels && !opt.deletedAt ? opt.label?.trim() : true;
      })
      .map((opt) => ({
        id: normalizeId(opt.id),
        label: shouldFilterEmptyLabels && !opt.deletedAt ? opt.label?.trim() || '' : opt.label || '',
        isCorrect: opt.isCorrect || false,
        settings: getOptionSettings(opt),
        ...(shouldIncludeDeleted && opt.deletedAt ? { deletedAt: opt.deletedAt } : {})
      }));
  };

  const filteredQuestions = shouldIncludeDeleted ? questions : questions.filter((q) => !q.deletedAt);

  return filteredQuestions.map((q, index) => ({
    id: normalizeId(q.id),
    question: q.title,
    points: q.points || 0,
    questionTypeId: q.questionTypeId,
    order: typeof (q as { order?: number }).order === 'number' ? (q as { order: number }).order : index + 1,
    settings: getQuestionSettings(q),
    options: questionTypeSupportsOptions(getQuestionTypeKey(q)) ? formatOptions(q.options) : [],
    ...(shouldIncludeDeleted && q.deletedAt ? { deletedAt: q.deletedAt } : {})
  }));
}
