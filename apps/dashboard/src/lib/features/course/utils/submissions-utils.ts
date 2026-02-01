/**
 * Determines if a submission was submitted before the due date
 * @param createdAt Submission creation timestamp
 * @param dueBy Exercise due date (can be null)
 * @returns true if submission is early or on time, false if late
 */
export function isSubmissionEarly(createdAt: string, dueBy: string | null): boolean {
  if (!dueBy) return true;
  return new Date(createdAt).getTime() <= new Date(dueBy).getTime();
}

/**
 * Calculates total points from a grades map
 * @param grades Map of question IDs to point values
 * @returns Sum of all points
 */
export function calculateTotalPoints(grades: { [questionId: string]: number }): number {
  if (!grades) return 0;
  return Object.values(grades).reduce(
    (acc, grade) => acc + (typeof grade === 'number' ? grade : parseInt(String(grade), 10) || 0),
    0
  );
}

/**
 * Gets maximum possible points from questions array
 * @param questions Array of questions with points property
 * @returns Sum of all question points
 */
export function getMaxPoints(questions: Array<{ points: number }>): number {
  if (!questions || !Array.isArray(questions)) return 0;
  return questions.reduce((acc, question) => acc + (question.points || 0), 0);
}

/**
 * Formats a date string for display
 * @param date ISO date string
 * @returns Formatted date string
 */
export function formatSubmittedDate(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  }).format(d);
}

/**
 * Formats answers into a question name to answer value map
 * @param questions Array of questions with id and name
 * @param answers Array of answers with question_id, answers array, and open_answer
 * @returns Map of question names to answer values (string or string array)
 */
export function formatAnswersForDisplay(
  questions: Array<{ id: number; name: string }>,
  answers: Array<{ question_id: number; answers: string[]; open_answer: string }>
): { [questionName: string]: string | string[] } {
  const result: { [questionName: string]: string | string[] } = {};
  const questionByIdAndName: { [id: number]: string } = {};

  for (const question of questions) {
    questionByIdAndName[question.id] = question.name;
  }

  for (const answer of answers) {
    const questionName = questionByIdAndName[answer.question_id];
    if (questionName) {
      result[questionName] =
        Array.isArray(answer.answers) && answer.answers.length ? answer.answers : answer.open_answer;
    }
  }

  return result;
}
