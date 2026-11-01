import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Inbox, RefreshCw } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useGradingQueueQuery } from '@/feature/teach/api/grading-queue';
import { GradingQueueRow } from '@/feature/teach/components/grading-queue-row';
import { elapsedCopy, OLDEST_WAITED_KEYS } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQueueItem } from '@/feature/teach/types/teach';

function openSubmission(item: GradingQueueItem) {
  router.push({ pathname: '/teach/submission/[submissionId]', params: { submissionId: item.id } });
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function GradingQueueScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { courseId, courseTitle } = useLocalSearchParams<{ courseId?: string; courseTitle?: string }>();
  const queue = useGradingQueueQuery();
  const items = (queue.data ?? []).filter((item) => !courseId || item.courseId === courseId);
  const oldest = items[0];

  if (queue.isPending) {
    return (
      <View style={[styles.fill, styles.padded, { backgroundColor: colors.background }]}>
        <Skeleton height={20} width="60%" />
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} height={84} radius={14} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ItemGroup>
          <GradingQueueRow item={item} onPress={openSubmission} />
        </ItemGroup>
      )}
      ItemSeparatorComponent={Separator}
      contentInsetAdjustmentBehavior="automatic"
      refreshing={queue.isRefetching}
      onRefresh={() => queue.refetch()}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        oldest ? (
          <View style={styles.header}>
            {courseTitle ? (
              <Text variant="subheading" numberOfLines={2}>
                {courseTitle}
              </Text>
            ) : null}
            <Text variant="caption" tone="muted">
              {[t('queueHeader', { count: items.length }), elapsedCopy(t, OLDEST_WAITED_KEYS, oldest.submittedAt)]
                .filter(Boolean)
                .join(' ')}
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        queue.isError ? (
          <Empty>
            <EmptyMedia icon={Inbox} />
            <EmptyTitle>{t('queueLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(queue.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => queue.refetch()}>
                <ButtonIcon icon={RefreshCw} />
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty>
            <EmptyMedia icon={CircleCheck} />
            <EmptyTitle>{t('allGradedTitle')}</EmptyTitle>
            <EmptyDescription>
              {courseTitle ? t('allGradedCourseDescription', { course: courseTitle }) : t('allGradedDescription')}
            </EmptyDescription>
          </Empty>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, gap: SPACING.xs },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { gap: SPACING.xxs, paddingBottom: SPACING.sm },
  separator: { height: SPACING.xs }
});
