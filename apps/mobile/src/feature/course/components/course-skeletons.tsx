import { StyleSheet, View } from 'react-native';

import { ItemGroup } from '@/feature/common/components/item';
import { NotchCard } from '@/feature/common/components/notch-card';
import {
  Skeleton,
  SkeletonCard,
  SkeletonGroup,
  SkeletonText,
  SkeletonThumbnail
} from '@/feature/common/components/skeleton';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { COURSE_CARD_WIDTH } from './course-card';

const CARD_COVER_HEIGHT = Math.round((COURSE_CARD_WIDTH * 9) / 16);

/** The Home hero and course row while enrolled courses load. */
export function HomeSkeleton() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <View style={styles.section}>
        <SkeletonText variant="subheading" lines={1} width="45%" />
        <NotchCard>
          <SkeletonGroup color={isDark ? colors.borderStrong : colors.border} style={styles.hero}>
            <Skeleton height={0} radius={RADII.input} style={styles.heroBanner} />
            <View>
              <SkeletonText variant="heading" lines={1} width="70%" />
              <SkeletonText variant="caption" lines={1} width="40%" />
            </View>
            <Skeleton height={6} radius={RADII.pill} />
            <Skeleton height={44} radius={RADII.md} />
          </SkeletonGroup>
        </NotchCard>
      </View>
      <View style={styles.section}>
        <SkeletonText variant="subheading" lines={1} width="30%" />
        <View style={styles.row}>
          <SkeletonCard coverHeight={CARD_COVER_HEIGHT} lines={1} style={styles.card} />
          <SkeletonCard coverHeight={CARD_COVER_HEIGHT} lines={1} style={styles.card} />
        </View>
      </View>
    </>
  );
}

/** Rows shaped like the Learn list while it loads. */
export function CourseListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ItemGroup>
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonGroup key={index} style={styles.listRow}>
          <SkeletonThumbnail width={52} height={52} />
          <View style={styles.listCopy}>
            <SkeletonText variant="bodyStrong" lines={1} width="75%" />
            <SkeletonText variant="caption" lines={1} width="45%" />
          </View>
          <Skeleton width={34} height={34} radius={RADII.pill} />
        </SkeletonGroup>
      ))}
    </ItemGroup>
  );
}

const styles = StyleSheet.create({
  section: { gap: SPACING.sm },
  hero: { gap: SPACING.sm },
  heroBanner: { height: undefined, aspectRatio: 16 / 9 },
  row: { flexDirection: 'row', gap: SPACING.sm, marginRight: -GUTTER, overflow: 'hidden' },
  card: { width: COURSE_CARD_WIDTH },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 76,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  listCopy: { flex: 1 }
});
