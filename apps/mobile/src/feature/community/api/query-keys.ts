export const communityQuestionsQueryKey = (userId: string | null, orgId: string | null) =>
  ['community', 'questions', userId, orgId] as const;

export const communityQuestionQueryKey = (userId: string | null, orgId: string | null, slug: string) =>
  ['community', 'question', userId, orgId, slug] as const;

export const communityVotesQueryKey = (userId: string | null, orgId: string | null) =>
  ['community', 'votes', userId, orgId] as const;
