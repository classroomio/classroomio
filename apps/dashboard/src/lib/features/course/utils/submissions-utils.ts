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
