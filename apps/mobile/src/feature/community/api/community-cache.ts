import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type {
  CommunityForYouQuestion,
  CommunityQuestion,
  CommunityQuestionSummary
} from '@/feature/community/types/community';

import {
  communityForYouQueryKey,
  communityQuestionQueryKey,
  communityQuestionsQueryKey,
  communityVotesQueryKey
} from './query-keys';

type SummaryPatch = (question: CommunityQuestionSummary) => Partial<CommunityQuestionSummary>;

export type CommunityCacheSnapshot = {
  question: CommunityQuestion | undefined;
  list: CommunityQuestionSummary[] | undefined;
  forYou: CommunityForYouQuestion[] | undefined;
};

/** Reads and patches the cached community list, For you list and question detail for the signed-in member. */
export function useCommunityCache() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const keys = {
    list: communityQuestionsQueryKey(userId, orgId),
    forYou: communityForYouQueryKey(userId, orgId),
    detail: (slug: string) => communityQuestionQueryKey(userId, orgId, slug),
    votes: communityVotesQueryKey(userId, orgId)
  };

  const patchSummaries = (slug: string, patch: SummaryPatch) => {
    queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
      current?.map((question) => (question.slug === slug ? { ...question, ...patch(question) } : question))
    );
    queryClient.setQueryData<CommunityForYouQuestion[]>(keys.forYou, (current) =>
      current?.map((question) => (question.slug === slug ? { ...question, ...patch(question) } : question))
    );
  };

  const patchQuestion = (slug: string, patch: (question: CommunityQuestion) => Partial<CommunityQuestion>) => {
    queryClient.setQueryData<CommunityQuestion>(keys.detail(slug), (current) =>
      current ? { ...current, ...patch(current) } : current
    );
  };

  const removeSummaries = (slug: string) => {
    queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
      current?.filter((question) => question.slug !== slug)
    );
    queryClient.setQueryData<CommunityForYouQuestion[]>(keys.forYou, (current) =>
      current?.filter((question) => question.slug !== slug)
    );
  };

  /** Cancels in-flight fetches that would overwrite an optimistic update, then returns the current cache. */
  const snapshot = async (slug: string): Promise<CommunityCacheSnapshot> => {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: keys.detail(slug), exact: true }),
      queryClient.cancelQueries({ queryKey: keys.list, exact: true }),
      queryClient.cancelQueries({ queryKey: keys.forYou, exact: true })
    ]);

    return {
      question: queryClient.getQueryData<CommunityQuestion>(keys.detail(slug)),
      list: queryClient.getQueryData<CommunityQuestionSummary[]>(keys.list),
      forYou: queryClient.getQueryData<CommunityForYouQuestion[]>(keys.forYou)
    };
  };

  const restore = (slug: string, saved: CommunityCacheSnapshot | undefined) => {
    if (!saved) return;

    queryClient.setQueryData(keys.detail(slug), saved.question);
    queryClient.setQueryData(keys.list, saved.list);
    queryClient.setQueryData(keys.forYou, saved.forYou);
  };

  return { queryClient, keys, patchSummaries, patchQuestion, removeSummaries, snapshot, restore };
}
