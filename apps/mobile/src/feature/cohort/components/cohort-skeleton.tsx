import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonGroup, SkeletonList, SkeletonText } from '@/feature/common/components/skeleton';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { COURSE_CARD_WIDTH } from '@/feature/course/components/course-card';

/** The cohort screen's goals, courses and announcements while they load. */
export function CohortSkeleton() {
  return (
    <>
      <View style={styles.section}>
        <SkeletonGroup>
          <SkeletonText variant="subheading" lines={1} width="30%" />
        </SkeletonGroup>
        <SkeletonList count={1} />
      </View>
      <SkeletonGroup style={styles.section}>
        <SkeletonText variant="subheading" lines={1} width="30%" />
        <View style={styles.row}>
          {[0, 1].map((index) => (
            <View key={index} style={styles.card}>
              <Skeleton height={0} radius={RADII.xl} style={styles.artwork} />
              <SkeletonText variant="subheading" lines={1} width="80%" />
            </View>
          ))}
        </View>
      </SkeletonGroup>
      <SkeletonGroup style={styles.section}>
        <SkeletonText variant="subheading" lines={1} width="40%" />
        <Skeleton height={140} radius={RADII.xl} />
      </SkeletonGroup>
    </>
  );
}

/** Rows shaped like the cohort list while it loads. */
export function CohortListSkeleton() {
  return <SkeletonList count={2} />;
}

const styles = StyleSheet.create({
  section: { gap: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm, marginRight: -GUTTER, overflow: 'hidden' },
  card: { width: COURSE_CARD_WIDTH, gap: SPACING.sm },
  artwork: { height: undefined, aspectRatio: 16 / 10 }
});
