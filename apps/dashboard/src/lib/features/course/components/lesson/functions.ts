import type { LessonCompletion } from '$features/course/utils/types';

export function getUniqueValue(label: string) {
  return label.toLowerCase().replace(' ', '');
}

export function generateQuestion(questions) {
  const generatedQuestions = [];

  for (const question of questions) {
    const name = getUniqueValue(question.title);
    const options = question.options.map((option) => {
      option.value = getUniqueValue(option.label);
      return option;
    });

    generatedQuestions.push({
      ...question,
      name,
      options
    });
  }

  return generatedQuestions;
}

export function getIsLessonComplete(completions: LessonCompletion[], profileId: string | undefined): boolean {
  if (!Array.isArray(completions)) return false;
  return completions.some((c) => {
    return c.is_complete && c.profile_id === profileId;
  });
}
