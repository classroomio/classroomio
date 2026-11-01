import { FlashList } from '@shopify/flash-list';
import { MessagesSquare } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Skeleton } from '@/feature/common/components/skeleton';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { QuestionCard } from './question-card';

type QuestionListProps = {
  questions: CommunityQuestionSummary[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (question: CommunityQuestionSummary) => void;
  header?: ReactElement;
  empty: ReactElement;
};

export function QuestionList({ questions, loading, refreshing, onRefresh, onOpen, header, empty }: QuestionListProps) {
  const { colors } = useTheme();

  return (
    <FlashList
      data={questions}
      keyExtractor={(question) => question.slug ?? question.title ?? ''}
      renderItem={({ item }) => <QuestionCard question={item} onPress={onOpen} />}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <QuestionListSkeleton /> : empty}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.inkMuted} />}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.background }}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function QuestionListSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton height={132} radius={RADII.xl} />
      <Skeleton height={132} radius={RADII.xl} />
      <Skeleton height={132} radius={RADII.xl} />
    </View>
  );
}

export function QuestionListEmpty({ filtered }: { filtered: boolean }) {
  const t = useTranslations(communityCatalog);

  return (
    <Empty>
      <EmptyMedia icon={MessagesSquare} />
      <EmptyTitle>{filtered ? t('emptyFilteredTitle') : t('emptyTitle')}</EmptyTitle>
      <EmptyDescription>{filtered ? t('emptyFilteredDescription') : t('emptyDescription')}</EmptyDescription>
    </Empty>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  separator: { height: SPACING.sm },
  skeleton: { gap: SPACING.sm }
});
