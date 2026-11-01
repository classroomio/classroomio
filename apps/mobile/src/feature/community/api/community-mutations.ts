import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAccountQuery } from '@/feature/account/api/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { removeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type {
  CommunityAnswer,
  CommunityQuestion,
  CommunityQuestionSummary,
  QuestionFields
} from '@/feature/community/types/community';

import { communityQuestionQueryKey, communityQuestionsQueryKey, communityVotesQueryKey } from './query-keys';

function useCommunityKeys() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return {
    list: communityQuestionsQueryKey(userId, orgId),
    detail: (slug: string) => communityQuestionQueryKey(userId, orgId, slug),
    votes: communityVotesQueryKey(userId, orgId)
  };
}

function updateSummary(
  questions: CommunityQuestionSummary[] | undefined,
  slug: string,
  update: (question: CommunityQuestionSummary) => CommunityQuestionSummary
) {
  return questions?.map((question) => (question.slug === slug ? update(question) : question));
}

export function useAskQuestionMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();

  return useMutation({
    mutationFn: async (fields: QuestionFields) => {
      const response = await request(api.community.compose.question.$post({ json: fields }));

      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list })
  });
}

type UpdateQuestionInput = QuestionFields & { courseTitle: string };

export function useUpdateQuestionMutation(question: Pick<CommunityQuestion, 'id' | 'slug'> | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();
  const t = useTranslations(communityCatalog);

  return useMutation({
    mutationFn: async ({ title, body, courseId }: UpdateQuestionInput) => {
      if (!question) throw new Error(t('questionUnavailable'));

      await request(api.community[':id'].$put({ param: { id: String(question.id) }, json: { title, body, courseId } }));
    },
    onSuccess: (_result, { title, body, courseId, courseTitle }) => {
      if (!question?.slug) return;

      const slug = question.slug;
      queryClient.setQueryData<CommunityQuestion>(keys.detail(slug), (current) =>
        current ? { ...current, title, body, courseId, courseTitle } : current
      );
      queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
        updateSummary(current, slug, (summary) => ({ ...summary, title, courseId, courseTitle }))
      );
    }
  });
}

export function useDeleteQuestionMutation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();

  return useMutation({
    mutationFn: async (question: Pick<CommunityQuestion, 'id' | 'slug'>) => {
      await request(api.community[':id'].$delete({ param: { id: String(question.id) } }));
    },
    onSuccess: (_result, question) => {
      if (!question.slug) return;

      const slug = question.slug;
      queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
        current?.filter((summary) => summary.slug !== slug)
      );
      queryClient.removeQueries({ queryKey: keys.detail(slug), exact: true });
      removeQuerySnapshot(keys.detail(slug));
    }
  });
}

export function useAnswerQuestionMutation(slug: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();
  const account = useAccountQuery();

  return useMutation({
    mutationFn: async ({ questionId, body }: { questionId: number; body: string }) => {
      const response = await request(
        api.community.compose.question[':id'].answer.$post({ param: { id: String(questionId) }, json: { body } })
      );

      return response.data;
    },
    onSuccess: (answer) => {
      const profile = account.data?.profile;
      const created: CommunityAnswer = {
        id: answer.id,
        body: answer.body,
        votes: answer.votes,
        createdAt: answer.createdAt,
        author: { id: answer.authorId, fullname: profile?.fullname ?? null, avatarUrl: profile?.avatarUrl ?? null }
      };

      queryClient.setQueryData<CommunityQuestion>(keys.detail(slug), (current) =>
        current ? { ...current, comments: [...current.comments, created] } : current
      );
      queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
        updateSummary(current, slug, (summary) => ({ ...summary, comments: Number(summary.comments) + 1 }))
      );
    }
  });
}

export function useDeleteAnswerMutation(slug: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();

  return useMutation({
    mutationFn: async (answerId: string) => {
      await request(api.community[':id'].comment.$delete({ param: { id: answerId } }));
    },
    onSuccess: (_result, answerId) => {
      queryClient.setQueryData<CommunityQuestion>(keys.detail(slug), (current) =>
        current ? { ...current, comments: current.comments.filter((answer) => answer.id !== answerId) } : current
      );
      queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
        updateSummary(current, slug, (summary) => ({ ...summary, comments: Math.max(0, Number(summary.comments) - 1) }))
      );
    }
  });
}

/** Posts upvoted this session. The API records no voters, so this mirrors the web's one-vote-per-visit guard. */
export function useVotedPosts() {
  const keys = useCommunityKeys();
  const votes = useQuery({
    queryKey: keys.votes,
    queryFn: () => [] as string[],
    staleTime: Infinity,
    gcTime: Infinity
  });

  return new Set(votes.data ?? []);
}

export const questionVoteKey = (questionId: number) => `question:${questionId}`;
export const answerVoteKey = (answerId: string) => `answer:${answerId}`;

type UpvoteInput = { kind: 'question'; id: number } | { kind: 'answer'; id: string };

function voteKeyOf(input: UpvoteInput) {
  return input.kind === 'question' ? questionVoteKey(input.id) : answerVoteKey(input.id);
}

function withVotes(
  question: CommunityQuestion,
  input: UpvoteInput,
  votes: (current: number) => number
): CommunityQuestion {
  if (input.kind === 'question') return { ...question, votes: votes(question.votes ?? 0) };

  return {
    ...question,
    comments: question.comments.map((answer) =>
      answer.id === input.id ? { ...answer, votes: votes(answer.votes ?? 0) } : answer
    )
  };
}

export function useUpvoteMutation(slug: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const keys = useCommunityKeys();
  const detailKey = keys.detail(slug);

  return useMutation({
    mutationFn: async (input: UpvoteInput) => {
      const response = await request(
        api.community[':id'].upvote.$post({
          param: { id: String(input.id) },
          json: { isQuestion: input.kind === 'question' }
        })
      );

      return response.data?.votes ?? null;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previousQuestion = queryClient.getQueryData<CommunityQuestion>(detailKey);
      const previousList = queryClient.getQueryData<CommunityQuestionSummary[]>(keys.list);

      queryClient.setQueryData<string[]>(keys.votes, (current) => [...(current ?? []), voteKeyOf(input)]);
      queryClient.setQueryData<CommunityQuestion>(detailKey, (current) =>
        current ? withVotes(current, input, (votes) => votes + 1) : current
      );
      if (input.kind === 'question') {
        queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
          updateSummary(current, slug, (summary) => ({ ...summary, votes: (summary.votes ?? 0) + 1 }))
        );
      }

      return { previousQuestion, previousList };
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData<string[]>(keys.votes, (current) => current?.filter((key) => key !== voteKeyOf(input)));
      queryClient.setQueryData(detailKey, context?.previousQuestion);
      queryClient.setQueryData(keys.list, context?.previousList);
    },
    onSuccess: (votes, input) => {
      if (votes === null) return;

      queryClient.setQueryData<CommunityQuestion>(detailKey, (current) =>
        current ? withVotes(current, input, () => votes) : current
      );
      if (input.kind === 'question') {
        queryClient.setQueryData<CommunityQuestionSummary[]>(keys.list, (current) =>
          updateSummary(current, slug, (summary) => ({ ...summary, votes }))
        );
      }
    }
  });
}
