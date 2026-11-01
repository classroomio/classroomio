import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useCohortCommentsQuery,
  useCohortPost,
  useCreateCohortCommentMutation
} from '@/feature/cohort/api/cohort-newsfeed';
import { CohortComment } from '@/feature/cohort/components/cohort-comment';
import { CohortPost } from '@/feature/cohort/components/cohort-post';
import { useCohortReactions } from '@/feature/cohort/helpers/use-cohort-reactions';
import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import {
  Composer,
  ComposerInput,
  ComposerNotice,
  ComposerRow,
  ComposerScrollView,
  ComposerSend
} from '@/feature/common/components/composer';
import { Empty, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

export default function CohortAnnouncementScreen() {
  const { cohortId, postId } = useLocalSearchParams<{ cohortId: string; postId: string }>();
  const t = useTranslations(cohortCatalog);
  const { colors } = useTheme();
  const offline = useIsOffline();
  const { post, isPending } = useCohortPost(cohortId, postId);
  const comments = useCohortCommentsQuery(cohortId, postId);
  const createComment = useCreateCohortCommentMutation(cohortId, postId);
  const { memberId, react } = useCohortReactions(cohortId);
  const [draft, setDraft] = useState('');

  if (!post) {
    return (
      <View style={[styles.screen, styles.missing, { backgroundColor: colors.background }]}>
        {isPending ? (
          <SkeletonList count={2} />
        ) : (
          <Empty>
            <EmptyMedia icon={MegaphoneIcon} />
            <EmptyTitle>{t('announcementMissing')}</EmptyTitle>
          </Empty>
        )}
      </View>
    );
  }

  const submit = () => {
    const content = draft.trim();
    if (!content) return;

    createComment.mutate(content, {
      onSuccess: () => setDraft(''),
      onError: (error) => showToast({ tone: 'danger', title: t('commentFailed'), description: errorMessage(error) })
    });
  };

  const header = (
    <View style={styles.header}>
      <CohortPost post={post} memberId={memberId} disabled={offline} onToggleReaction={react} variant="plain" />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text variant="subheading" accessibilityRole="header">
        {t('comments')}
      </Text>
      {comments.isPending ? <SkeletonList count={2} /> : null}
      {comments.isError && !comments.data ? (
        <Text variant="caption" tone="danger">
          {t('commentsLoadError')}
        </Text>
      ) : null}
      {comments.data?.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t('noCommentsYet')}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlashList
        data={comments.data ?? []}
        keyExtractor={(comment) => String(comment.id)}
        renderItem={({ item }) => <CohortComment comment={item} />}
        ListHeaderComponent={header}
        renderScrollComponent={ComposerScrollView}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={<PullRefreshControl onRefresh={() => comments.refetch()} />}
        contentContainerStyle={styles.content}
      />
      <Composer
        value={draft}
        onChangeText={setDraft}
        onSubmit={submit}
        submitting={createComment.isPending}
        disabled={offline}
      >
        {offline ? (
          <ComposerNotice title={t('commentOfflineTitle')} description={t('commentOfflineDescription')} />
        ) : (
          <ComposerRow>
            <ComposerInput placeholder={t('writeComment')} accessibilityLabel={t('commentInputLabel')} />
            <ComposerSend accessibilityLabel={t('postComment')} />
          </ComposerRow>
        )}
      </Composer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  missing: { padding: GUTTER },
  header: { gap: SPACING.md, paddingBottom: SPACING.xs },
  divider: { height: StyleSheet.hairlineWidth * 2 },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, paddingBottom: SPACING.xl }
});
