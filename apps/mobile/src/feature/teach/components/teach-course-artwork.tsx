import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Skeleton, SkeletonGroup } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseBanner } from '@/feature/course/components/course-banner';

type TeachCourseArtworkProps = {
  uri?: string | null;
  recyclingKey?: string;
  title: string | null;
  meta?: string | null;
};

/** The course artwork with its title set over a scrim, heading the course snapshot. */
export function TeachCourseArtwork({ uri, recyclingKey, title, meta }: TeachCourseArtworkProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.muted }]}>
      <CourseBanner uri={uri} recyclingKey={recyclingKey} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="teachScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.2" stopColor={colors.artworkScrim} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.artworkScrim} stopOpacity={0.84} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#teachScrim)" />
      </Svg>
      <View style={styles.overlay}>
        {title ? (
          <>
            {meta ? (
              <Text variant="captionStrong" numberOfLines={1} style={{ color: withAlpha(colors.onSolid, 0.82) }}>
                {meta}
              </Text>
            ) : null}
            <Text variant="title" accessibilityRole="header" numberOfLines={3} style={{ color: colors.onSolid }}>
              {title}
            </Text>
          </>
        ) : (
          <SkeletonGroup color={withAlpha(colors.onSolid, 0.28)} style={styles.skeleton}>
            <Skeleton width="35%" height={12} radius={RADII.xs} />
            <Skeleton width="80%" height={22} radius={RADII.xs} />
          </SkeletonGroup>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 16 / 10,
    justifyContent: 'flex-end',
    borderRadius: RADII.sheet,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  overlay: { padding: SPACING.lg, gap: SPACING.xxs },
  skeleton: { gap: SPACING.xs }
});
