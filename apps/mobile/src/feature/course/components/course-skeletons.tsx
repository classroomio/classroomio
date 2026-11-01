import { StyleSheet, View } from 'react-native';

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
import { COURSE_ROW_ARTWORK_RATIO, COURSE_ROW_ARTWORK_WIDTH } from './course-row';

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
  const { colors } = useTheme();

  return (
    <SkeletonGroup>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index}>
          {index > 0 ? <View style={[styles.listSeparator, { backgroundColor: colors.border }]} /> : null}
          <View style={styles.listRow}>
            <SkeletonThumbnail
              width={COURSE_ROW_ARTWORK_WIDTH}
              height={Math.round(COURSE_ROW_ARTWORK_WIDTH / COURSE_ROW_ARTWORK_RATIO)}
              radius={RADII.lg}
            />
            <View style={styles.listCopy}>
              <SkeletonText variant="subheading" lines={1} width="80%" />
              <SkeletonText variant="caption" lines={1} width="50%" />
              <Skeleton height={4} radius={RADII.pill} style={styles.listProgress} />
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  section: { gap: SPACING.sm },
  hero: { gap: SPACING.sm },
  heroBanner: { height: undefined, aspectRatio: 16 / 9 },
  row: { flexDirection: 'row', gap: SPACING.sm, marginRight: -GUTTER, overflow: 'hidden' },
  card: { width: COURSE_CARD_WIDTH },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  listCopy: { flex: 1, gap: 2 },
  listProgress: { marginTop: SPACING.xs, width: '70%' },
  listSeparator: { height: StyleSheet.hairlineWidth, marginLeft: COURSE_ROW_ARTWORK_WIDTH + SPACING.md }
});
