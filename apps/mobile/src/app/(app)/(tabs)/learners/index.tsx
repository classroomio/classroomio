import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { HandWavingIcon } from 'phosphor-react-native/src/icons/HandWaving';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { StudentIcon } from 'phosphor-react-native/src/icons/Student';
import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/feature/common/api/request';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useDebouncedValue } from '@/feature/common/helpers/use-debounced-value';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useNudgeLearnerMutation, useTeachingLearnersQuery } from '@/feature/staff/api/teaching-insights';
import { LearnerRow } from '@/feature/staff/components/learner-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { LearnerFilter, TeachingLearner } from '@/feature/staff/types/staff';
import { showToast } from '@/feature/toast/helpers/toast-store';

const NUDGE_RATE_LIMITED = 'NUDGE_RATE_LIMITED';

function learnerKey(learner: TeachingLearner) {
  return `${learner.profileId}-${learner.course.id}`;
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function LearnersScreen() {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter: LearnerFilter = params.filter === 'needs-nudge' ? 'needs-nudge' : 'all';
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const learners = useTeachingLearnersQuery(filter, search);
  const nudge = useNudgeLearnerMutation();
  const [nudgingKey, setNudgingKey] = useState<string | null>(null);
  const items = learners.data?.pages.flatMap((page) => page.items) ?? [];

  const sendNudge = (learner: TeachingLearner) => {
    const name = learner.fullname || learner.email || t('learnerFallback');
    setNudgingKey(learnerKey(learner));
    nudge.mutate(
      { courseId: learner.course.id, profileId: learner.profileId },
      {
        onSuccess: () => {
          successHaptic();
          showToast({ tone: 'success', title: t('nudgeSent', { name }), description: t('nudgeSentDescription') });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === NUDGE_RATE_LIMITED) {
            void learners.refetch();
            showToast({ tone: 'info', title: t('nudgeLimited'), description: t('nudgeLimitedDescription') });
            return;
          }

          showToast({ tone: 'danger', title: t('nudgeFailed'), description: errorMessage(error) });
        },
        onSettled: () => setNudgingKey(null)
      }
    );
  };

  const empty = learners.isPending ? (
    <SkeletonList count={6} />
  ) : learners.isError ? (
    <Empty>
      <EmptyMedia icon={StudentIcon} />
      <EmptyTitle>{t('learnersLoadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(learners.error)}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => learners.refetch()}>
          <ButtonIcon icon={ArrowsClockwiseIcon} />
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  ) : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyDescription>{t('noLearnerMatches', { search })}</EmptyDescription>
    </Empty>
  ) : filter === 'needs-nudge' ? (
    <Empty>
      <EmptyMedia icon={HandWavingIcon} />
      <EmptyTitle>{t('noNudgeTitle')}</EmptyTitle>
      <EmptyDescription>{t('noNudgeDescription')}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyMedia icon={StudentIcon} />
      <EmptyTitle>{t('noLearnersTitle')}</EmptyTitle>
      <EmptyDescription>{t('noLearnersDescription')}</EmptyDescription>
    </Empty>
  );

  return (
    <>
      <Stack.SearchBar
        placeholder={t('searchLearners')}
        hideWhenScrolling={false}
        obscureBackground={false}
        tintColor={colors.primary}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <FlashList
        data={items}
        keyExtractor={learnerKey}
        renderItem={({ item }) => (
          <ItemGroup>
            <LearnerRow learner={item} nudging={nudgingKey === learnerKey(item)} onNudge={sendNudge} />
          </ItemGroup>
        )}
        extraData={nudgingKey}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              value={filter}
              onValueChange={(next) => router.setParams({ filter: next === 'all' ? '' : next })}
            >
              <SegmentedControlItem value="all">{t('segmentAll')}</SegmentedControlItem>
              <SegmentedControlItem value="needs-nudge">{t('segmentNeedsNudge')}</SegmentedControlItem>
            </SegmentedControl>
          </View>
        }
        ListEmptyComponent={empty}
        ListFooterComponent={
          learners.isFetchingNextPage ? (
            <View style={styles.footer}>
              <Spinner />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (learners.hasNextPage && !learners.isFetchingNextPage) void learners.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        refreshControl={<PullRefreshControl onRefresh={() => learners.refetch()} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  separator: { height: SPACING.xs },
  footer: { paddingVertical: SPACING.lg }
});
