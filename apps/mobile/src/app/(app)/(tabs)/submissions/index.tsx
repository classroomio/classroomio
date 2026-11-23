import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { ClockCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { TrayIcon } from 'phosphor-react-native/src/icons/Tray';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useSubmissionHistoryQuery, useUpcomingSubmissionsQuery } from '@/feature/staff/api/teaching-insights';
import { GradedSubmissionRow, UpcomingSubmissionRow } from '@/feature/staff/components/submission-rows';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { GradedSubmission, UpcomingSubmission } from '@/feature/staff/types/staff';
import { useGradingQueueQuery } from '@/feature/teach/api/grading-queue';
import { GradingQueueRow } from '@/feature/teach/components/grading-queue-row';
import { elapsedCopy, OLDEST_WAITED_KEYS } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQueueItem } from '@/feature/teach/types/teach';

type Segment = 'upcoming' | 'review' | 'history';

type Row =
  | { kind: 'upcoming'; key: string; item: UpcomingSubmission }
  | { kind: 'review'; key: string; item: GradingQueueItem }
  | { kind: 'history'; key: string; item: GradedSubmission };

function isSegment(value: string | undefined): value is Segment {
  return value === 'upcoming' || value === 'review' || value === 'history';
}

function openSubmission(submissionId: string) {
  router.push({ pathname: '/submissions/[submissionId]', params: { submissionId } });
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function SubmissionsScreen() {
  const t = useTranslations(staffCatalog);
  const teach = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ segment?: string; courseId?: string; courseTitle?: string }>();
  const segment: Segment = isSegment(params.segment) ? params.segment : 'review';
  const courseId = params.courseId;
  const queue = useGradingQueueQuery();
  const upcoming = useUpcomingSubmissionsQuery();
  const history = useSubmissionHistoryQuery({ enabled: segment === 'history' });

  const inCourse = (id: string | null | undefined) => !courseId || id === courseId;
  const reviewItems = (queue.data ?? []).filter((item) => inCourse(item.courseId));
  const upcomingItems = (upcoming.data ?? []).filter((item) => inCourse(item.courseId));
  const historyItems = (history.data?.pages.flatMap((page) => page.items) ?? []).filter((item) =>
    inCourse(item.courseId)
  );

  const rows: Row[] =
    segment === 'upcoming'
      ? upcomingItems.map((item) => ({ kind: 'upcoming', key: item.exerciseId, item }))
      : segment === 'history'
        ? historyItems.map((item) => ({ kind: 'history', key: item.id, item }))
        : reviewItems.map((item) => ({ kind: 'review', key: item.id, item }));

  const active = segment === 'upcoming' ? upcoming : segment === 'history' ? history : queue;
  const oldest = reviewItems[0];

  const retry = (
    <EmptyContent>
      <Button variant="outline" onPress={() => active.refetch()}>
        <ButtonIcon icon={ArrowsClockwiseIcon} />
        <ButtonText>{common('retry')}</ButtonText>
      </Button>
    </EmptyContent>
  );

  const emptyBySegment: Record<Segment, ReactElement> = {
    upcoming: upcoming.isError ? (
      <Empty>
        <EmptyMedia icon={CalendarBlankIcon} />
        <EmptyTitle>{t('upcomingLoadError')}</EmptyTitle>
        <EmptyDescription>{errorMessage(upcoming.error)}</EmptyDescription>
        {retry}
      </Empty>
    ) : (
      <Empty>
        <EmptyMedia icon={CalendarBlankIcon} />
        <EmptyTitle>{t('noUpcomingTitle')}</EmptyTitle>
        <EmptyDescription>{t('noUpcomingDescription')}</EmptyDescription>
      </Empty>
    ),
    review: queue.isError ? (
      <Empty>
        <EmptyMedia icon={TrayIcon} />
        <EmptyTitle>{teach('queueLoadError')}</EmptyTitle>
        <EmptyDescription>{errorMessage(queue.error)}</EmptyDescription>
        {retry}
      </Empty>
    ) : (
      <Empty>
        <EmptyIllustration name="grading" />
        <EmptyTitle>{teach('allGradedTitle')}</EmptyTitle>
        <EmptyDescription>
          {params.courseTitle
            ? teach('allGradedCourseDescription', { course: params.courseTitle })
            : teach('allGradedDescription')}
        </EmptyDescription>
      </Empty>
    ),
    history: history.isError ? (
      <Empty>
        <EmptyMedia icon={ClockCounterClockwiseIcon} />
        <EmptyTitle>{t('historyLoadError')}</EmptyTitle>
        <EmptyDescription>{errorMessage(history.error)}</EmptyDescription>
        {retry}
      </Empty>
    ) : (
      <Empty>
        <EmptyMedia icon={ClockCounterClockwiseIcon} />
        <EmptyTitle>{t('noHistoryTitle')}</EmptyTitle>
        <EmptyDescription>{t('noHistoryDescription')}</EmptyDescription>
      </Empty>
    )
  };

  const header = (
    <View style={styles.header}>
      {params.courseTitle ? (
        <Text variant="subheading" numberOfLines={2}>
          {params.courseTitle}
        </Text>
      ) : null}
      <SegmentedControl value={segment} onValueChange={(next) => router.setParams({ segment: next })}>
        <SegmentedControlItem value="upcoming">{t('segmentUpcoming')}</SegmentedControlItem>
        <SegmentedControlItem value="review">{t('segmentToReview')}</SegmentedControlItem>
        <SegmentedControlItem value="history">{t('segmentHistory')}</SegmentedControlItem>
      </SegmentedControl>
      {segment === 'review' && oldest ? (
        <Text variant="caption" tone="muted">
          {[
            teach('queueHeader', { count: reviewItems.length }),
            elapsedCopy(teach, OLDEST_WAITED_KEYS, oldest.submittedAt)
          ]
            .filter(Boolean)
            .join(' ')}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlashList
      data={rows}
      keyExtractor={(row) => `${row.kind}-${row.key}`}
      getItemType={(row) => row.kind}
      renderItem={({ item: row }) => (
        <ItemGroup>
          {row.kind === 'upcoming' ? (
            <UpcomingSubmissionRow item={row.item} />
          ) : row.kind === 'history' ? (
            <GradedSubmissionRow item={row.item} onPress={(item) => openSubmission(item.id)} />
          ) : (
            <GradingQueueRow item={row.item} onPress={(item) => openSubmission(item.id)} />
          )}
        </ItemGroup>
      )}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header}
      ListEmptyComponent={active.isPending ? <SkeletonList count={5} /> : emptyBySegment[segment]}
      ListFooterComponent={
        segment === 'history' && history.isFetchingNextPage ? (
          <View style={styles.footer}>
            <Spinner />
          </View>
        ) : null
      }
      onEndReached={() => {
        if (segment === 'history' && history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<PullRefreshControl onRefresh={() => active.refetch()} />}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  separator: { height: SPACING.xs },
  footer: { paddingVertical: SPACING.lg }
});
