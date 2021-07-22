import { QUESTION_TYPE } from '../../../../Question/constants';

export function wasCorrectAnswerSelected(currentQuestion, answers) {
  if (currentQuestion.type === QUESTION_TYPE.TEXTAREA) {
    return true;
  }

  const answer = answers[currentQuestion.id];
  const formattedAnswers = typeof answer === 'string' ? [answer] : answer;
  return (
    formattedAnswers &&
    formattedAnswers.some((answer) => {
      if (
        !currentQuestion.answers ||
        !currentQuestion.answers.length ||
        currentQuestion.answers.includes(answer)
      ) {
        return true;
      }

      return false;
    })
  );
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
  const isOpenQuesiton = question.type === QUESTION_TYPE.TEXTAREA;

  return {
    title: questionIndex + '. ' + question.title,
    name: `${question.id}`,
    options: question.options,
    answers: question.answers,
    code: question.code,
    defaultValue: isOpenQuesiton
      ? answers[question.id] || ''
      : answers[question.id] || [],
    onSubmit,
    onPrevious,
    disablePreviousButton: questionIndex === 1,
    isLast,
    isPreview: preview || isFinished,
    disabled:
      (isFinished && wasCorrectAnswerSelected(question, answers)) || isFinished,
    nextButtonProps: isOpenQuesiton
      ? {
          label: 'Next',
          isActive: true,
        }
      : wasCorrectAnswerSelected(question, answers)
      ? {
          label: isLast ? 'Finish' : 'Next',
          isActive: true,
          disableOptionSelect: true,
        }
      : {
          label: 'Check',
          isActive: false,
        },
  };
}
