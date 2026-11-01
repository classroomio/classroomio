import type { CommunityAnswer } from '@/feature/community/types/community';

/** The answers a viewer may see, with the accepted answer first and the rest in posting order. */
export function orderAnswers(answers: CommunityAnswer[], acceptedAnswerId: string | null, includeHidden: boolean) {
  const visible = includeHidden ? answers : answers.filter((answer) => !answer.isHidden);
  const accepted = visible.find((answer) => answer.id === acceptedAnswerId);
  if (!accepted) return visible;

  return [accepted, ...visible.filter((answer) => answer !== accepted)];
}
