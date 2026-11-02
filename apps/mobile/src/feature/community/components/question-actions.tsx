import { ArrowFatUpIcon } from 'phosphor-react-native/src/icons/ArrowFatUp';
import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { BellSimpleSlashIcon } from 'phosphor-react-native/src/icons/BellSimpleSlash';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { LinkIcon } from 'phosphor-react-native/src/icons/Link';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { createContext, use, useRef, useState, type ReactNode, type Ref } from 'react';

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
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetItem,
  OptionSheetSeparator,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { selectionHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import {
  questionVoteKey,
  useDeleteQuestionMutation,
  useFollowQuestionMutation,
  useQuestionVisibilityMutation,
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
  canModerate: boolean;
  linkOf: (question: CommunityQuestionSummary) => string | null;
  open: (question: CommunityQuestionSummary) => void;
  upvote: (question: CommunityQuestionSummary) => void;
  toggleFollow: (question: CommunityQuestionSummary) => void;
  toggleHidden: (question: CommunityQuestionSummary) => void;
  copyLink: (question: CommunityQuestionSummary) => void;
  edit: (question: CommunityQuestionSummary) => void;
  remove: (question: CommunityQuestionSummary) => void;
  /** Opens the actions as a bottom sheet, for platforms without the native link context menu. */
  openMenu: (question: CommunityQuestionSummary) => void;
};

const QuestionActionsContext = createContext<QuestionActionsValue | null>(null);

/** Actions offered on a question card's context menu. `null` outside `QuestionActions`. */
export function useQuestionActions() {
  return use(QuestionActionsContext);
}

/** Owns the list-level question actions, their option sheet and the delete confirmation they share. */
export function QuestionActions({ children }: { children: ReactNode }) {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const { org, isStaff } = useActiveOrg();
  const webHost = useOrgWebHost();
  const offline = useIsOffline();
  const voted = useVotedPosts();
  const upvoteMutation = useUpvoteMutation();
  const followMutation = useFollowQuestionMutation();
  const visibilityMutation = useQuestionVisibilityMutation();
  const deleteMutation = useDeleteQuestionMutation();
  const [confirming, setConfirming] = useState<CommunityQuestionSummary | null>(null);
  const [menuQuestion, setMenuQuestion] = useState<CommunityQuestionSummary | null>(null);
  const menu = useRef<SheetRef>(null);

  const isVoted = (question: CommunityQuestionSummary) => voted.has(questionVoteKey(question.id));

  const value: QuestionActionsValue = {
    offline,
    isVoted,
    canUpvote: (question) => Boolean(question.slug && question.id) && !offline && !isVoted(question),
    canManage: (question) => Boolean(userId && question.id && (question.authorId === userId || isStaff)),
    canModerate: isStaff,
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
    toggleFollow: (question) => {
      if (!question.slug) return;

      const follow = !question.isFollowing;
      selectionHaptic();
      followMutation.mutate(
        { id: question.id, slug: question.slug, follow },
        {
          onSuccess: () => {
            if (follow)
              showToast({ title: t('followedTitle'), description: t('followedDescription'), tone: 'success' });
          },
          onError: (error) => showToast({ title: t('followFailed'), description: errorMessage(error), tone: 'danger' })
        }
      );
    },
    toggleHidden: (question) => {
      if (!question.slug) return;

      selectionHaptic();
      visibilityMutation.mutate(
        { id: question.id, slug: question.slug, hidden: !question.isHidden },
        {
          onError: (error) =>
            showToast({ title: t('visibilityFailed'), description: errorMessage(error), tone: 'danger' })
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
    remove: setConfirming,
    openMenu: (question) => {
      selectionHaptic();
      setMenuQuestion(question);
      menu.current?.present();
    }
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
      <QuestionActionsSheet
        ref={menu}
        question={menuQuestion}
        onDismiss={() => setMenuQuestion(null)}
        actions={value}
      />
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

type QuestionActionsSheetProps = {
  ref: Ref<SheetRef>;
  question: CommunityQuestionSummary | null;
  onDismiss: () => void;
  actions: QuestionActionsValue;
};

function QuestionActionsSheet({ ref, question, onDismiss, actions }: QuestionActionsSheetProps) {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const manage = question ? actions.canManage(question) : false;
  const voted = question ? actions.isVoted(question) : false;

  return (
    <OptionSheet ref={ref} onDismiss={onDismiss}>
      {question ? (
        <>
          <OptionSheetTitle>{question.title}</OptionSheetTitle>
          <OptionSheetItem icon={ArrowSquareOutIcon} onSelect={() => actions.open(question)}>
            {tc('open')}
          </OptionSheetItem>
          <OptionSheetItem
            icon={ArrowFatUpIcon}
            selected={voted}
            disabled={!actions.canUpvote(question)}
            onSelect={() => actions.upvote(question)}
          >
            {voted ? t('upvoted') : t('upvote')}
          </OptionSheetItem>
          <OptionSheetItem
            icon={question.isFollowing ? BellSimpleSlashIcon : BellSimpleIcon}
            disabled={actions.offline}
            onSelect={() => actions.toggleFollow(question)}
          >
            {question.isFollowing ? t('unfollowQuestion') : t('followQuestion')}
          </OptionSheetItem>
          {actions.linkOf(question) ? (
            <OptionSheetItem icon={LinkIcon} onSelect={() => actions.copyLink(question)}>
              {t('copyLink')}
            </OptionSheetItem>
          ) : null}
          {manage || actions.canModerate ? <OptionSheetSeparator /> : null}
          {manage ? (
            <OptionSheetItem icon={PencilSimpleIcon} disabled={actions.offline} onSelect={() => actions.edit(question)}>
              {t('editQuestion')}
            </OptionSheetItem>
          ) : null}
          {actions.canModerate ? (
            <OptionSheetItem
              icon={question.isHidden ? EyeIcon : EyeSlashIcon}
              disabled={actions.offline}
              onSelect={() => actions.toggleHidden(question)}
            >
              {question.isHidden ? t('showToLearners') : t('hideFromLearners')}
            </OptionSheetItem>
          ) : null}
          {manage ? (
            <OptionSheetItem
              icon={TrashIcon}
              destructive
              disabled={actions.offline}
              onSelect={() => actions.remove(question)}
            >
              {t('deleteQuestion')}
            </OptionSheetItem>
          ) : null}
        </>
      ) : null}
      <OptionSheetCancel />
    </OptionSheet>
  );
}
