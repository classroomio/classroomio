import { useMutation, useQuery } from '@tanstack/react-query';

import { useAccountQuery } from '@/feature/account/api/account';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { removeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityAnswer, CommunityQuestion, QuestionFields } from '@/feature/community/types/community';

import { useCommunityCache } from './community-cache';

export function useAskQuestionMutation() {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async (fields: QuestionFields) => {
      const response = await request(api.community.compose.question.$post({ json: fields }));

      return response.data;
    },
    onSuccess: () =>
      Promise.all([
        cache.queryClient.invalidateQueries({ queryKey: cache.keys.list }),
        cache.queryClient.invalidateQueries({ queryKey: cache.keys.forYou })
      ])
  });
}

type UpdateQuestionInput = QuestionFields & { courseTitle: string };

export function useUpdateQuestionMutation(question: Pick<CommunityQuestion, 'id' | 'slug'> | undefined) {
  const api = useApi();
  const cache = useCommunityCache();
  const t = useTranslations(communityCatalog);

  return useMutation({
    mutationFn: async ({ title, body, courseId }: UpdateQuestionInput) => {
      if (!question) throw new Error(t('questionUnavailable'));

      await request(api.community[':id'].$put({ param: { id: String(question.id) }, json: { title, body, courseId } }));
    },
    onSuccess: (_result, { title, body, courseId, courseTitle }) => {
      if (!question?.slug) return;

      cache.patchQuestion(question.slug, () => ({ title, body, courseId, courseTitle }));
      cache.patchSummaries(question.slug, () => ({ title, courseId, courseTitle }));
    }
  });
}

export function useDeleteQuestionMutation() {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async (question: Pick<CommunityQuestion, 'id' | 'slug'>) => {
      await request(api.community[':id'].$delete({ param: { id: String(question.id) } }));
    },
    onSuccess: (_result, question) => {
      if (!question.slug) return;

      const detailKey = cache.keys.detail(question.slug);
      cache.removeSummaries(question.slug);
      cache.queryClient.removeQueries({ queryKey: detailKey, exact: true });
      removeQuerySnapshot(detailKey);
    }
  });
}

export function useAnswerQuestionMutation(slug: string) {
  const api = useApi();
  const cache = useCommunityCache();
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
        isHidden: false,
        author: { id: answer.authorId, fullname: profile?.fullname ?? null, avatarUrl: profile?.avatarUrl ?? null }
      };
      const activityAt = answer.createdAt ?? new Date().toISOString();

      cache.patchQuestion(slug, (current) => ({ comments: [...current.comments, created], isFollowing: true }));
      cache.patchSummaries(slug, (summary) => ({
        comments: Number(summary.comments) + 1,
        isFollowing: true,
        lastActivityAt: activityAt
      }));
      void cache.queryClient.invalidateQueries({ queryKey: cache.keys.forYou });
    }
  });
}

export function useDeleteAnswerMutation(slug: string) {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async (answerId: string) => {
      await request(api.community[':id'].comment.$delete({ param: { id: answerId } }));
    },
    onSuccess: (_result, answerId) => {
      cache.patchQuestion(slug, (current) => ({
        comments: current.comments.filter((answer) => answer.id !== answerId),
        acceptedAnswerId: current.acceptedAnswerId === answerId ? null : current.acceptedAnswerId
      }));
      cache.patchSummaries(slug, (summary) => ({
        comments: Math.max(0, Number(summary.comments) - 1),
        acceptedAnswerId: summary.acceptedAnswerId === answerId ? null : summary.acceptedAnswerId
      }));
    }
  });
}

type FollowInput = { id: number; slug: string; follow: boolean };

export function useFollowQuestionMutation() {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async ({ id, follow }: FollowInput) => {
      const param = { id: String(id) };
      const response = await request(
        follow ? api.community[':id'].follow.$post({ param }) : api.community[':id'].follow.$delete({ param })
      );

      return response.data;
    },
    onMutate: async ({ slug, follow }) => {
      const saved = await cache.snapshot(slug);
      cache.patchQuestion(slug, () => ({ isFollowing: follow }));
      cache.patchSummaries(slug, () => ({ isFollowing: follow }));

      return saved;
    },
    onError: (_error, { slug }, saved) => cache.restore(slug, saved),
    onSettled: () => cache.queryClient.invalidateQueries({ queryKey: cache.keys.forYou })
  });
}

type QuestionVisibilityInput = { id: number; slug: string; hidden: boolean };

export function useQuestionVisibilityMutation() {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async ({ id, hidden }: QuestionVisibilityInput) => {
      const param = { id: String(id) };
      const response = await request(
        hidden ? api.community[':id'].hide.$post({ param }) : api.community[':id'].hide.$delete({ param })
      );

      return response.data;
    },
    onMutate: async ({ slug, hidden }) => {
      const saved = await cache.snapshot(slug);
      cache.patchQuestion(slug, () => ({ isHidden: hidden }));
      cache.patchSummaries(slug, () => ({ isHidden: hidden }));

      return saved;
    },
    onError: (_error, { slug }, saved) => cache.restore(slug, saved)
  });
}

type AnswerVisibilityInput = { answerId: string; hidden: boolean };

export function useAnswerVisibilityMutation(slug: string) {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async ({ answerId, hidden }: AnswerVisibilityInput) => {
      const param = { answerId };
      const response = await request(
        hidden
          ? api.community.answer[':answerId'].hide.$post({ param })
          : api.community.answer[':answerId'].hide.$delete({ param })
      );

      return response.data;
    },
    onMutate: async ({ answerId, hidden }) => {
      const saved = await cache.snapshot(slug);
      cache.patchQuestion(slug, (current) => ({
        comments: current.comments.map((answer) => (answer.id === answerId ? { ...answer, isHidden: hidden } : answer))
      }));

      return saved;
    },
    onError: (_error, _input, saved) => cache.restore(slug, saved)
  });
}

type AcceptAnswerInput = { questionId: number; answerId: string | null };

export function useAcceptAnswerMutation(slug: string) {
  const api = useApi();
  const cache = useCommunityCache();

  return useMutation({
    mutationFn: async ({ questionId, answerId }: AcceptAnswerInput) => {
      const response = await request(
        api.community[':id']['accepted-answer'].$put({ param: { id: String(questionId) }, json: { answerId } })
      );

      return response.data;
    },
    onMutate: async ({ answerId }) => {
      const saved = await cache.snapshot(slug);
      cache.patchQuestion(slug, () => ({ acceptedAnswerId: answerId }));
      cache.patchSummaries(slug, () => ({ acceptedAnswerId: answerId }));

      return saved;
    },
    onError: (_error, _input, saved) => cache.restore(slug, saved)
  });
}

/** Posts upvoted this session. The API records no voters, so this mirrors the web's one-vote-per-visit guard. */
export function useVotedPosts() {
  const cache = useCommunityCache();
  const votes = useQuery({
    queryKey: cache.keys.votes,
    queryFn: () => [] as string[],
    staleTime: Infinity,
    gcTime: Infinity
  });

  return new Set(votes.data ?? []);
}

export const questionVoteKey = (questionId: number) => `question:${questionId}`;
export const answerVoteKey = (answerId: string) => `answer:${answerId}`;

type UpvoteInput = { slug: string } & ({ kind: 'question'; id: number } | { kind: 'answer'; id: string });

function voteKeyOf(input: UpvoteInput) {
  return input.kind === 'question' ? questionVoteKey(input.id) : answerVoteKey(input.id);
}

function withVotes(
  question: CommunityQuestion,
  input: UpvoteInput,
  votes: (current: number) => number
): Partial<CommunityQuestion> {
  if (input.kind === 'question') return { votes: votes(question.votes ?? 0) };

  return {
    comments: question.comments.map((answer) =>
      answer.id === input.id ? { ...answer, votes: votes(answer.votes ?? 0) } : answer
    )
  };
}

export function useUpvoteMutation() {
  const api = useApi();
  const cache = useCommunityCache();

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
      const saved = await cache.snapshot(input.slug);

      cache.queryClient.setQueryData<string[]>(cache.keys.votes, (current) => [...(current ?? []), voteKeyOf(input)]);
      cache.patchQuestion(input.slug, (current) => withVotes(current, input, (votes) => votes + 1));
      if (input.kind === 'question') {
        cache.patchSummaries(input.slug, (summary) => ({ votes: (summary.votes ?? 0) + 1 }));
      }

      return saved;
    },
    onError: (_error, input, saved) => {
      cache.queryClient.setQueryData<string[]>(cache.keys.votes, (current) =>
        current?.filter((key) => key !== voteKeyOf(input))
      );
      cache.restore(input.slug, saved);
    },
    onSuccess: (votes, input) => {
      if (votes === null) return;

      cache.patchQuestion(input.slug, (current) => withVotes(current, input, () => votes));
      if (input.kind === 'question') cache.patchSummaries(input.slug, () => ({ votes }));
    }
  });
}
