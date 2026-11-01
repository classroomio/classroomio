import { StyleSheet, View } from 'react-native';

import { ScreenSection } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { RADII, SPACING } from '@/feature/common/constants/layout';

export function CourseDetailSkeleton() {
  return (
    <>
      <View style={styles.heading}>
        <Skeleton height={26} width="80%" />
        <Skeleton height={16} width="45%" />
      </View>
      <Skeleton height={156} radius={RADII.xl} />
      <ScreenSection>
        <Skeleton height={18} width="50%" />
        <Skeleton height={248} radius={RADII.xl} />
      </ScreenSection>
    </>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xs }
});
