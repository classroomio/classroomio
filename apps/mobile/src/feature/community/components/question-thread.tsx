import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { BellSimpleSlashIcon } from 'phosphor-react-native/src/icons/BellSimpleSlash';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { LinkIcon } from 'phosphor-react-native/src/icons/Link';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerNotice,
  ComposerRow,
  ComposerScrollView,
  ComposerSend
} from '@/feature/common/components/composer';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { FlashHighlight } from '@/feature/common/components/flash-highlight';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetSeparator
} from '@/feature/common/components/option-sheet';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { plainTextToEditorHtml } from '@/feature/common/helpers/editor-html';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { selectionHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useImageAttachments } from '@/feature/common/helpers/use-image-attachments';
import { useRevealNewItem } from '@/feature/common/helpers/use-reveal-new-item';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useCommunityQuestionQuery } from '@/feature/community/api/community-question';
import {
  answerVoteKey,
  questionVoteKey,
  useAcceptAnswerMutation,
  useAnswerQuestionMutation,
  useAnswerVisibilityMutation,
  useDeleteAnswerMutation,
  useDeleteQuestionMutation,
  useFollowQuestionMutation,
  useQuestionVisibilityMutation,
  useUpvoteMutation,
  useVotedPosts
} from '@/feature/community/api/community-mutations';
import { orderAnswers } from '@/feature/community/helpers/answer-order';
import { questionWebUrlOf } from '@/feature/community/helpers/question-url';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityAnswer } from '@/feature/community/types/community';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOrgWebHost } from '@/feature/org/helpers/org-web-host';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { showToast } from '@/feature/toast/helpers/toast-store';

import { FollowHeaderButton } from './follow-header-button';
import { AnswerPost, QuestionPost } from './question-thread-posts';

type MenuTarget = { kind: 'question' } | { kind: 'answer'; answerId: string };

const isAnswer = (answer: CommunityAnswer, id: string) => String(answer.id) === id;

export function QuestionThread({ slug }: { slug: string }) {
  const { colors } = useTheme();
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const { org, isStaff } = useActiveOrg();
  const webHost = useOrgWebHost();
  const offline = useIsOffline();
  const question = useCommunityQuestionQuery(slug);
  const voted = useVotedPosts();
  const upvote = useUpvoteMutation();
  const answerMutation = useAnswerQuestionMutation(slug);
  const deleteQuestion = useDeleteQuestionMutation();
  const deleteAnswer = useDeleteAnswerMutation(slug);
  const follow = useFollowQuestionMutation();
  const questionVisibility = useQuestionVisibilityMutation();
  const answerVisibility = useAnswerVisibilityMutation(slug);
  const accept = useAcceptAnswerMutation(slug);
  const attachments = useImageAttachments();
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState<MenuTarget>({ kind: 'question' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState<MenuTarget | null>(null);

  const data = question.data;
  const canModerate = Boolean(data?.canModerate);
  const canAccept = Boolean(data && userId && (canModerate || data.authorId === userId));
  const answers = data ? orderAnswers(data.comments, data.acceptedAnswerId, canModerate) : [];
  const listRef = useRef<FlashListRef<CommunityAnswer>>(null);
  const newAnswer = useRevealNewItem({ listRef, data: answers, matches: isAnswer });
  const canManage = (authorId: string | null | undefined) => Boolean(userId && (authorId === userId || isStaff));
  const link = webHost && org?.siteName ? questionWebUrlOf(webHost, org.siteName, slug, isStaff) : null;
  const menuAnswer = menu.kind === 'answer' ? answers.find((answer) => answer.id === menu.answerId) : undefined;

  const openMenu = (target: MenuTarget) => {
    setMenu(target);
    setMenuOpen(true);
  };

  const runUpvote = (input: { kind: 'question'; id: number } | { kind: 'answer'; id: string }) =>
    upvote.mutate(
      { ...input, slug },
      {
        onError: (error) => showToast({ title: t('upvoteFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );

  const toggleFollow = () => {
    if (!data) return;

    const following = !data.isFollowing;
    selectionHaptic();
    follow.mutate(
      { id: data.id, slug, follow: following },
      {
        onSuccess: () => {
          if (following)
            showToast({ title: t('followedTitle'), description: t('followedDescription'), tone: 'success' });
        },
        onError: (error) => showToast({ title: t('followFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );
  };

  const showVisibilityError = (error: Error) =>
    showToast({ title: t('visibilityFailed'), description: errorMessage(error), tone: 'danger' });

  const toggleQuestionHidden = () => {
    if (!data) return;

    questionVisibility.mutate({ id: data.id, slug, hidden: !data.isHidden }, { onError: showVisibilityError });
  };

  const toggleAnswerHidden = (answer: CommunityAnswer) =>
    answerVisibility.mutate({ answerId: answer.id, hidden: !answer.isHidden }, { onError: showVisibilityError });

  const toggleAccepted = (answer: CommunityAnswer) => {
    if (!data) return;

    const accepting = data.acceptedAnswerId !== answer.id;
    accept.mutate(
      { questionId: data.id, answerId: accepting ? answer.id : null },
      {
        onSuccess: () => {
          if (!accepting) return;

          successHaptic();
          newAnswer.reveal(answer.id);
        },
        onError: (error) => showToast({ title: t('acceptFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );
  };

  const copyLink = () => {
    if (!link) return;

    void Clipboard.setStringAsync(link).then(() => {
      successHaptic();
      showToast({ title: t('linkCopied'), tone: 'success' });
    });
  };

  const submitAnswer = () => {
    if (!data) return;

    const body = plainTextToEditorHtml(draft, attachments.urls);
    answerMutation.mutate(
      { questionId: data.id, body },
      {
        onSuccess: (answer) => {
          successHaptic();
          setDraft('');
          attachments.reset();
          newAnswer.reveal(answer.id);
        },
        onError: (error) => showToast({ title: t('answerFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );
  };

  const confirmDelete = () => {
    if (!confirming || !data) return;

    if (confirming.kind === 'question') {
      deleteQuestion.mutate(data, {
        onSuccess: () => {
          setConfirming(null);
          showToast({ title: t('questionDeleted'), tone: 'success' });
          router.back();
        },
        onError: (error) =>
          showToast({ title: t('questionDeleteFailed'), description: errorMessage(error), tone: 'danger' })
      });
      return;
    }

    deleteAnswer.mutate(confirming.answerId, {
      onSuccess: () => {
        setConfirming(null);
        showToast({ title: t('answerDeleted'), tone: 'success' });
      },
      onError: (error) =>
        showToast({ title: t('answerDeleteFailed'), description: errorMessage(error), tone: 'danger' })
    });
  };

  const answerHasMenu = (answer: CommunityAnswer) => canAccept || canModerate || canManage(answer.author.id);

  const header = data ? (
    <View style={styles.header}>
      {data.isHidden ? (
        <Banner tone="warning">
          <BannerIcon icon={EyeSlashIcon} />
          <BannerContent>
            <BannerTitle>{t('hiddenFromLearners')}</BannerTitle>
            <BannerDescription>{t('hiddenQuestionDescription')}</BannerDescription>
          </BannerContent>
        </Banner>
      ) : null}
      <QuestionPost
        question={data}
        voted={voted.has(questionVoteKey(data.id))}
        disabled={offline}
        onUpvote={() => runUpvote({ kind: 'question', id: data.id })}
        onOpenMenu={() => openMenu({ kind: 'question' })}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text variant="subheading" accessibilityRole="header">
        {answers.length === 0 ? t('noAnswersYet') : t('answerCount', { count: answers.length })}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t('screenTitleQuestion'),
          headerRight: data
            ? () => <FollowHeaderButton following={data.isFollowing} disabled={offline} onPress={toggleFollow} />
            : undefined
        }}
      />

      {!data && question.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={20} width="45%" />
          <Skeleton height={28} />
          <Skeleton height={120} radius={RADII.lg} />
        </View>
      ) : null}

      {!data && question.isError ? (
        <Empty>
          <EmptyMedia icon={WarningCircleIcon} />
          <EmptyTitle>{t('questionLoadFailed')}</EmptyTitle>
          <EmptyDescription>{errorMessage(question.error)}</EmptyDescription>
        </Empty>
      ) : null}

      {data ? (
        <FlashList
          ref={listRef}
          data={answers}
          keyExtractor={(answer) => answer.id}
          renderItem={({ item }) => (
            <FlashHighlight active={newAnswer.highlightedId === String(item.id)}>
              <AnswerPost
                answer={item}
                accepted={item.id === data.acceptedAnswerId}
                voted={voted.has(answerVoteKey(item.id))}
                disabled={offline}
                onUpvote={() => runUpvote({ kind: 'answer', id: item.id })}
                onOpenMenu={answerHasMenu(item) ? () => openMenu({ kind: 'answer', answerId: item.id }) : undefined}
              />
            </FlashHighlight>
          )}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text variant="caption" tone="muted">
              {t('answerHint')}
            </Text>
          }
          renderScrollComponent={ComposerScrollView}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          refreshControl={<PullRefreshControl onRefresh={() => question.refetch()} />}
          contentContainerStyle={styles.content}
        />
      ) : null}

      {data ? (
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSubmit={submitAnswer}
          submitting={answerMutation.isPending}
          disabled={offline}
          canSubmit={(draft.trim().length > 0 || attachments.urls.length > 0) && !attachments.uploading}
        >
          {offline ? (
            <ComposerNotice title={t('answerOfflineTitle')} description={t('answerOfflineDescription')} />
          ) : (
            <>
              <ComposerAttachments items={attachments.items} onRemove={attachments.remove} />
              <ComposerRow>
                <ComposerAttach onPress={() => void attachments.pick()} />
                <ComposerInput placeholder={t('answerPlaceholder')} accessibilityLabel={t('answerInputLabel')} />
                <ComposerSend accessibilityLabel={t('postAnswer')} />
              </ComposerRow>
            </>
          )}
        </Composer>
      ) : null}

      <OptionSheet open={menuOpen} onOpenChange={setMenuOpen}>
        <OptionSheetContent>
          {data && menu.kind === 'question' ? (
            <>
              <OptionSheetItem
                icon={data.isFollowing ? BellSimpleSlashIcon : BellSimpleIcon}
                disabled={offline}
                onSelect={toggleFollow}
              >
                {data.isFollowing ? t('unfollowQuestion') : t('followQuestion')}
              </OptionSheetItem>
              {link ? (
                <OptionSheetItem icon={LinkIcon} onSelect={copyLink}>
                  {t('copyLink')}
                </OptionSheetItem>
              ) : null}
              {canManage(data.authorId) || canModerate ? <OptionSheetSeparator /> : null}
              {canManage(data.authorId) ? (
                <OptionSheetItem
                  icon={PencilSimpleIcon}
                  disabled={offline}
                  onSelect={() => router.push({ pathname: '/community/edit/[slug]', params: { slug } })}
                >
                  {t('editQuestion')}
                </OptionSheetItem>
              ) : null}
              {canModerate ? (
                <OptionSheetItem
                  icon={data.isHidden ? EyeIcon : EyeSlashIcon}
                  disabled={offline}
                  onSelect={toggleQuestionHidden}
                >
                  {data.isHidden ? t('showToLearners') : t('hideFromLearners')}
                </OptionSheetItem>
              ) : null}
              {canManage(data.authorId) ? (
                <OptionSheetItem
                  icon={TrashIcon}
                  destructive
                  disabled={offline}
                  onSelect={() => setConfirming({ kind: 'question' })}
                >
                  {t('deleteQuestion')}
                </OptionSheetItem>
              ) : null}
            </>
          ) : null}
          {data && menuAnswer ? (
            <>
              {canAccept ? (
                <OptionSheetItem
                  icon={data.acceptedAnswerId === menuAnswer.id ? XCircleIcon : CheckCircleIcon}
                  disabled={offline || (menuAnswer.isHidden && data.acceptedAnswerId !== menuAnswer.id)}
                  onSelect={() => toggleAccepted(menuAnswer)}
                >
                  {data.acceptedAnswerId === menuAnswer.id ? t('unmarkAccepted') : t('markAccepted')}
                </OptionSheetItem>
              ) : null}
              {canModerate ? (
                <OptionSheetItem
                  icon={menuAnswer.isHidden ? EyeIcon : EyeSlashIcon}
                  disabled={offline}
                  onSelect={() => toggleAnswerHidden(menuAnswer)}
                >
                  {menuAnswer.isHidden ? t('showToLearners') : t('hideFromLearners')}
                </OptionSheetItem>
              ) : null}
              {canManage(menuAnswer.author.id) ? (
                <OptionSheetItem
                  icon={TrashIcon}
                  destructive
                  disabled={offline}
                  onSelect={() => setConfirming({ kind: 'answer', answerId: menuAnswer.id })}
                >
                  {t('deleteAnswer')}
                </OptionSheetItem>
              ) : null}
            </>
          ) : null}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        busy={deleteQuestion.isPending || deleteAnswer.isPending}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirming?.kind === 'question' ? t('deleteQuestionTitle') : t('deleteAnswerTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirming?.kind === 'question' ? t('deleteQuestionDescription') : t('deleteAnswerDescription')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction
              variant="destructive"
              loading={deleteQuestion.isPending || deleteAnswer.isPending}
              onPress={confirmDelete}
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { gap: SPACING.sm, padding: GUTTER },
  header: { gap: SPACING.md, paddingBottom: SPACING.sm },
  divider: { height: StyleSheet.hairlineWidth * 2 },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  separator: { height: SPACING.sm }
});
