import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { createContext, use, useState, type ReactNode } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { selectionHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import {
  questionVoteKey,
  useDeleteQuestionMutation,
  useUpvoteMutation,
  useVotedPosts
} from '@/feature/community/api/community-mutations';
import { questionWebUrlOf } from '@/feature/community/helpers/question-url';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOrgWebHost } from '@/feature/org/helpers/org-web-host';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { showToast } from '@/feature/toast/helpers/toast-store';

type QuestionActionsValue = {
  offline: boolean;
  isVoted: (question: CommunityQuestionSummary) => boolean;
  canUpvote: (question: CommunityQuestionSummary) => boolean;
  canManage: (question: CommunityQuestionSummary) => boolean;
  linkOf: (question: CommunityQuestionSummary) => string | null;
  open: (question: CommunityQuestionSummary) => void;
  upvote: (question: CommunityQuestionSummary) => void;
  copyLink: (question: CommunityQuestionSummary) => void;
  edit: (question: CommunityQuestionSummary) => void;
  remove: (question: CommunityQuestionSummary) => void;
};

const QuestionActionsContext = createContext<QuestionActionsValue | null>(null);

/** Actions offered on a question card's context menu. `null` outside `QuestionActions`. */
export function useQuestionActions() {
  return use(QuestionActionsContext);
}

/** Owns the list-level question actions and the delete confirmation they share. */
export function QuestionActions({ children }: { children: ReactNode }) {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const { org, isStaff } = useActiveOrg();
  const webHost = useOrgWebHost();
  const offline = useIsOffline();
  const voted = useVotedPosts();
  const upvoteMutation = useUpvoteMutation();
  const deleteMutation = useDeleteQuestionMutation();
  const [confirming, setConfirming] = useState<CommunityQuestionSummary | null>(null);

  const isVoted = (question: CommunityQuestionSummary) => voted.has(questionVoteKey(question.id));

  const value: QuestionActionsValue = {
    offline,
    isVoted,
    canUpvote: (question) => Boolean(question.slug && question.id) && !offline && !isVoted(question),
    canManage: (question) => Boolean(userId && question.id && (question.authorId === userId || isStaff)),
    linkOf: (question) =>
      question.slug && webHost && org?.siteName
        ? questionWebUrlOf(webHost, org.siteName, question.slug, isStaff)
        : null,
    open: (question) => {
      if (!question.slug) return;

      router.push({ pathname: '/community/[slug]', params: { slug: question.slug } });
    },
    upvote: (question) => {
      if (!question.slug) return;

      selectionHaptic();
      upvoteMutation.mutate(
        { kind: 'question', id: question.id, slug: question.slug },
        {
          onError: (error) => showToast({ title: t('upvoteFailed'), description: errorMessage(error), tone: 'danger' })
        }
      );
    },
    copyLink: (question) => {
      const link = value.linkOf(question);
      if (!link) return;

      void Clipboard.setStringAsync(link).then(() => {
        successHaptic();
        showToast({ title: t('linkCopied'), tone: 'success' });
      });
    },
    edit: (question) => {
      if (!question.slug) return;

      router.push({ pathname: '/community/edit/[slug]', params: { slug: question.slug } });
    },
    remove: setConfirming
  };

  const confirmDelete = () => {
    if (!confirming) return;

    deleteMutation.mutate(confirming, {
      onSuccess: () => {
        setConfirming(null);
        showToast({ title: t('questionDeleted'), tone: 'success' });
      },
      onError: (error) =>
        showToast({ title: t('questionDeleteFailed'), description: errorMessage(error), tone: 'danger' })
    });
  };

  return (
    <QuestionActionsContext value={value}>
      {children}
      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        busy={deleteMutation.isPending}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t('deleteQuestionTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteQuestionDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={deleteMutation.isPending} onPress={confirmDelete}>
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </QuestionActionsContext>
  );
}
