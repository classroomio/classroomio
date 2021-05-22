export function getUniqueValue(label) {
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
      options,
    });
  }

  return generatedQuestions;
}
