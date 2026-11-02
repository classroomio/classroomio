import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { NOTCH, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

const NOTCH_PATH = 'M0 0 H46 Q41.6 0 40.4 2.6 L38 8.4 Q36.9 11 34.2 11 H11.8 Q9.1 11 8 8.4 L5.6 2.6 Q4.4 0 0 0 Z';

type NotchCardProps = ViewProps & {
  tone?: 'muted' | 'tint';
  /** Colour of the surface the card sits on, so the notch reads as a cut-out. */
  cutoutColor?: string;
};

/** The ClassroomIO notch card: a muted block with a trapezoid bite out of its top edge. */
export function NotchCard({ tone = 'muted', cutoutColor, style, children, ...props }: NotchCardProps) {
  const { colors } = useTheme();
  const fill = tone === 'tint' ? colors.primaryTint : colors.mutedStrong;

  return (
    <View {...props} style={[styles.card, { backgroundColor: fill }, style]}>
      <Svg width={NOTCH.width} height={NOTCH.height} viewBox="0 0 46 11" style={styles.notch} pointerEvents="none">
        <Path d={NOTCH_PATH} fill={cutoutColor ?? colors.background} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    padding: SPACING.md,
    paddingTop: SPACING.md + 4
  },
  notch: { position: 'absolute', top: 0, left: NOTCH.inset }
});
