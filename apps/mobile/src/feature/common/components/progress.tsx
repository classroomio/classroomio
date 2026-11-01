import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function Progress({ value }: { value: number }) {
  const { colors } = useTheme();
  const percent = clamp(value);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={[styles.track, { backgroundColor: colors.mutedStrong }]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

type ProgressRingProps = { value: number; size?: number; strokeWidth?: number };

export function ProgressRing({ value, size = 36, strokeWidth = 3.5 }: ProgressRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamp(value) / 100);

  return (
    <Svg
      width={size}
      height={size}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(value)) }}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.mutedStrong}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.primary}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill }
});
