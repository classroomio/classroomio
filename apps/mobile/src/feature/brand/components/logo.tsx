import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/feature/common/components/text';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';

type LogoProps = { size?: number; wordmark?: boolean };

export function LogoMark({ size = 28, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const fill = color ?? colors.primary;

  return (
    <Svg
      width={size * (916 / 666)}
      height={size}
      viewBox="55 180 916 666"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M385 180 H518 Q528 180 528 190 V836 Q528 846 518 846 H385 A333 333 0 0 1 385 180 Z" fill={fill} />
      <Circle cx={796} cy={353} r={173} fill={fill} />
      <Path
        d="M748 595 H961 Q971 595 971 605 V836 Q971 846 961 846 H601 Q591 846 591 836 V752 A157 157 0 0 1 748 595 Z"
        fill={fill}
      />
    </Svg>
  );
}

export function Logo({ size = 24, wordmark = true }: LogoProps) {
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="ClassroomIO">
      <LogoMark size={size} />
      {wordmark && (
        <Text style={[styles.wordmark, { fontSize: size * 0.92, lineHeight: size * 1.1 }]}>classroomio</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: FONT_FAMILY.extrabold, letterSpacing: -0.7 }
});
