import { StyleSheet, View } from 'react-native';

import { ScreenSection } from '@/feature/common/components/screen';
import {
  Skeleton,
  SkeletonCard,
  SkeletonGroup,
  SkeletonList,
  SkeletonText
} from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';

/** Everything under the course banner while the course loads: heading, progress card, links and outline. */
export function CourseDetailSkeleton() {
  return (
    <>
      <View>
        <SkeletonText variant="title" lines={1} width="80%" />
        <SkeletonText variant="caption" lines={1} width="45%" />
      </View>
      <SkeletonCard>
        <View style={styles.progress}>
          <Skeleton width={48} height={48} radius={RADII.pill} />
          <View style={styles.copy}>
            <SkeletonText variant="bodyStrong" lines={1} width="55%" />
            <SkeletonText variant="caption" lines={1} width="80%" />
          </View>
        </View>
      </SkeletonCard>
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
  progress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  copy: { flex: 1 }
});
