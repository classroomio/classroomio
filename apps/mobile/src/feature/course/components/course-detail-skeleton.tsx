import { StyleSheet, View } from 'react-native';

import { ScreenSection } from '@/feature/common/components/screen';
import { Skeleton, SkeletonGroup, SkeletonList, SkeletonText } from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';

/** Everything under the course hero while the course loads: progress, links and outline. */
export function CourseDetailSkeleton() {
  return (
    <>
      <SkeletonGroup style={styles.progress}>
        <View style={styles.headline}>
          <Skeleton width={64} height={24} radius={RADII.xs} />
          <Skeleton width="35%" height={12} radius={RADII.xs} />
        </View>
        <Skeleton height={6} radius={RADII.pill} />
        <SkeletonText variant="caption" lines={1} width="60%" />
      </SkeletonGroup>
      <SkeletonList count={2} media="thumbnail" />
      <ScreenSection>
        <SkeletonGroup>
          <SkeletonText variant="subheading" lines={1} width="40%" />
        </SkeletonGroup>
        <SkeletonList count={4} media="thumbnail" />
      </ScreenSection>
    </>
  );
}

const styles = StyleSheet.create({
  progress: { gap: SPACING.xs },
  headline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }
});
