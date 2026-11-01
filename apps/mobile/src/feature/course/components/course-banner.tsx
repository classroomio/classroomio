import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { NotchCard } from '@/feature/common/components/notch-card';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

type CourseBannerProps = { uri?: string | null; recyclingKey?: string; style?: StyleProp<ViewStyle> };

/** A course's banner image, or stacked notch blocks on sand when the course has none. Size it through `style`. */
export function CourseBanner({ uri, recyclingKey, style }: CourseBannerProps) {
  const { colors } = useTheme();

  if (uri) {
    return (
      <View style={[styles.frame, { backgroundColor: colors.sand }, style]}>
        <Image
          source={{ uri }}
          recyclingKey={recyclingKey}
          contentFit="cover"
          transition={150}
          style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, { backgroundColor: colors.sand }, style]}>
      <View style={styles.stack}>
        <NotchCard cutoutColor={colors.sand} style={[styles.block, styles.top, { backgroundColor: colors.ring }]} />
        <NotchCard
          cutoutColor={colors.sand}
          style={[styles.block, styles.middle, { backgroundColor: colors.border }]}
        />
        <NotchCard
          cutoutColor={colors.sand}
          style={[styles.block, styles.bottom, { backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  stack: { position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: SPACING.sm, gap: 4 },
  block: { height: 24, padding: 0, paddingTop: 0 },
  top: { width: '34%', marginLeft: '14%' },
  middle: { width: '52%' },
  bottom: { width: '44%', marginLeft: '20%' }
});
