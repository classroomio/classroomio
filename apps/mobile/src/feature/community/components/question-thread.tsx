import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
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
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem
} from '@/feature/common/components/option-sheet';
import { FlashHighlight } from '@/feature/common/components/flash-highlight';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { plainTextToEditorHtml } from '@/feature/common/helpers/editor-html';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useImageAttachments } from '@/feature/common/helpers/use-image-attachments';
import { useRevealNewItem } from '@/feature/common/helpers/use-reveal-new-item';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useCommunityQuestionQuery } from '@/feature/community/api/community-question';
import {
  answerVoteKey,
  questionVoteKey,
  useAnswerQuestionMutation,
  useDeleteAnswerMutation,
  useDeleteQuestionMutation,
  useUpvoteMutation,
  useVotedPosts
} from '@/feature/community/api/community-mutations';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityAnswer } from '@/feature/community/types/community';

import { AnswerPost, QuestionPost } from './question-thread-posts';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';

type MenuTarget = { kind: 'question' } | { kind: 'answer'; answer: CommunityAnswer };

const isAnswer = (answer: CommunityAnswer, id: string) => String(answer.id) === id;

export function QuestionThread({ slug }: { slug: string }) {
  const { colors } = useTheme();
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const { isStaff } = useActiveOrg();
  const offline = useIsOffline();
  const question = useCommunityQuestionQuery(slug);
  const voted = useVotedPosts();
  const upvote = useUpvoteMutation();
  const answerMutation = useAnswerQuestionMutation(slug);
  const deleteQuestion = useDeleteQuestionMutation();
  const deleteAnswer = useDeleteAnswerMutation(slug);
  const attachments = useImageAttachments();
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [confirming, setConfirming] = useState<MenuTarget | null>(null);

  const data = question.data;
  const answers = data?.comments ?? [];
  const listRef = useRef<FlashListRef<CommunityAnswer>>(null);
  const newAnswer = useRevealNewItem({ listRef, data: answers, matches: isAnswer });
  const canManage = (authorId: string | null | undefined) => Boolean(userId && (authorId === userId || isStaff));

  const runUpvote = (input: { kind: 'question'; id: number } | { kind: 'answer'; id: string }) =>
    upvote.mutate(
      { ...input, slug },
      {
        onError: (error) => showToast({ title: t('upvoteFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );

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

    deleteAnswer.mutate(confirming.answer.id, {
      onSuccess: () => {
        setConfirming(null);
        showToast({ title: t('answerDeleted'), tone: 'success' });
      },
      onError: (error) =>
        showToast({ title: t('answerDeleteFailed'), description: errorMessage(error), tone: 'danger' })
    });
  };

  const header = data ? (
    <View style={styles.header}>
      <QuestionPost
        question={data}
        voted={voted.has(questionVoteKey(data.id))}
        disabled={offline}
        onUpvote={() => runUpvote({ kind: 'question', id: data.id })}
        onOpenMenu={canManage(data.authorId) ? () => setMenu({ kind: 'question' }) : undefined}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text variant="subheading" accessibilityRole="header">
        {answers.length === 0 ? t('noAnswersYet') : t('answerCount', { count: answers.length })}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('screenTitleQuestion') }} />

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
                voted={voted.has(answerVoteKey(item.id))}
                disabled={offline}
                onUpvote={() => runUpvote({ kind: 'answer', id: item.id })}
                onOpenMenu={canManage(item.author.id) ? () => setMenu({ kind: 'answer', answer: item }) : undefined}
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

      <OptionSheet open={menu !== null} onOpenChange={(open) => !open && setMenu(null)}>
        <OptionSheetContent>
          {menu?.kind === 'question' ? (
            <OptionSheetItem
              icon={PencilSimpleIcon}
              disabled={offline}
              onSelect={() => router.push({ pathname: '/community/edit/[slug]', params: { slug } })}
            >
              {t('editQuestion')}
            </OptionSheetItem>
          ) : null}
          <OptionSheetItem icon={TrashIcon} destructive disabled={offline} onSelect={() => setConfirming(menu)}>
            {menu?.kind === 'question' ? t('deleteQuestion') : t('deleteAnswer')}
          </OptionSheetItem>
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
