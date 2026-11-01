import type { CommunityQuestionSummary, CourseOption } from '@/feature/community/types/community';

/** Courses that have questions, sorted by title; `untitled` names courses without a title. */
export function coursesWithQuestions(questions: CommunityQuestionSummary[], untitled: string): CourseOption[] {
  const seen = new Map<string, string>();
  for (const question of questions) {
    if (!seen.has(question.courseId)) seen.set(question.courseId, question.courseTitle ?? untitled);
  }

  return [...seen]
    .map(([id, title]) => ({ id, title }))
    .sort((first, second) => first.title.localeCompare(second.title));
}
