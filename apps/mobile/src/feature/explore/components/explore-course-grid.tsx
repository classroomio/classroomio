import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { PullRefreshControl, type RefreshHandler } from '@/feature/common/components/pull-refresh-control';
import { Skeleton, SkeletonGroup, SkeletonText } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import type { ExploreCourseSummary } from '@/feature/explore/types/explore';

import { ExploreCourseCard } from './explore-course-card';

const COLUMNS = 2;
const COLUMN_GAP = SPACING.sm;
const ROW_GAP = SPACING.lg;
const SKELETON_CARDS = 4;

function cellStyle(index: number) {
  return index % COLUMNS === 0 ? styles.leftCell : styles.rightCell;
}

function renderCourse({ item, index }: { item: ExploreCourseSummary; index: number }) {
  return (
    <View style={cellStyle(index)}>
      <ExploreCourseCard course={item} />
    </View>
  );
}

function keyOf(course: ExploreCourseSummary) {
  return course.id;
}

type ExploreCourseGridProps = {
  courses: ExploreCourseSummary[];
  header?: ReactElement;
  empty?: ReactElement;
  loadingMore: boolean;
  onEndReached: () => void;
  onRefresh: RefreshHandler;
};

/** The catalogue as a two-column grid of artwork cards, loading further pages as it nears the end. */
export function ExploreCourseGrid({
  courses,
  header,
  empty,
  loadingMore,
  onEndReached,
  onRefresh
}: ExploreCourseGridProps) {
  const { colors } = useTheme();

  return (
    <FlashList
      data={courses}
      numColumns={COLUMNS}
      keyExtractor={keyOf}
      renderItem={renderCourse}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <Spinner />
          </View>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      refreshControl={<PullRefreshControl onRefresh={onRefresh} />}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    />
  );
}

/** Cards shaped like the Explore grid while the catalogue loads. */
export function ExploreCourseGridSkeleton() {
  return (
    <SkeletonGroup style={styles.skeleton}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <View key={index} style={[styles.skeletonCell, cellStyle(index)]}>
          <Skeleton height={0} radius={RADII.xl} style={styles.skeletonArtwork} />
          <View>
            <SkeletonText variant="subheading" lines={1} width="85%" />
            <SkeletonText variant="caption" lines={1} width="55%" />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  leftCell: { paddingRight: COLUMN_GAP / 2, paddingBottom: ROW_GAP },
  rightCell: { paddingLeft: COLUMN_GAP / 2, paddingBottom: ROW_GAP },
  footer: { paddingVertical: SPACING.lg, alignItems: 'center' },
  skeleton: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCell: { width: '50%', gap: SPACING.sm },
  skeletonArtwork: { height: undefined, aspectRatio: 16 / 10 }
});
