import { QUESTION_TYPE } from '$lib/components/Question/constants';
import { toggleConfetti } from '$lib/components/Confetti/store';

export const isAnswerCorrect = (options, answer) => {
  return options.some((option) => option.is_correct && option.value === answer);
};

/*
  GRADING RULES
  Textarea = no validation
  Single = only one should be correct
  Multiple = all should be correct
*/
export function wasCorrectAnswerSelected(currentQuestion, answers, isFinished?: boolean) {
  if (currentQuestion.question_type.id === QUESTION_TYPE.TEXTAREA) {
    return true;
  }

  const answer = answers[currentQuestion.name];

  const formattedAnswers = typeof answer === 'string' ? [answer] : answer;

  let isCorrect = false;

  if (currentQuestion.question_type.id === QUESTION_TYPE.CHECKBOX) {
    // Every correct answer should be in the selected answer
    isCorrect = currentQuestion.options
      .filter((o) => o.is_correct)
      .every((option) => formattedAnswers?.includes(option.value));
  } else if (currentQuestion.question_type.id === QUESTION_TYPE.RADIO) {
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
  questions,
  question,
  questionnaireMetaData,
  questionIndex,
  onSubmit,
  onPrevious,
  preview
) {
  const { answers, isFinished } = questionnaireMetaData;
  const isLast = questionIndex === questions.length;
  const isOpenQuesiton = question.question_type.id === QUESTION_TYPE.TEXTAREA;
  const isCorrect = wasCorrectAnswerSelected(question, answers, isFinished);

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
    name: `${question.name}`,
    options: question.options,
    code: question.code,
    defaultValue: isOpenQuesiton ? answers[question.name] || '' : answers[question.name] || [],
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
  return array.filter((item) => !item.deleted_at);
}
