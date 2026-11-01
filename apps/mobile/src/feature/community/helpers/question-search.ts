import type { CommunityQuestionSummary } from '@/feature/community/types/community';

/** Questions whose title, author or course contains every word of `query`, ignoring case and accents. */
export function searchQuestions(questions: CommunityQuestionSummary[], query: string, locale: string) {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase(locale);
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return questions;

  return questions.filter((question) => {
    const haystack = fold([question.title, question.authorFullname, question.courseTitle].filter(Boolean).join(' '));

    return words.every((word) => haystack.includes(word));
  });
}
