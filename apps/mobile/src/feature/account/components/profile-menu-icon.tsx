import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

/** A filled glyph on a solid colour tile, the way iOS Settings marks its rows. */
export function ProfileMenuIcon({ icon, color }: { icon: AppIcon; color: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.tile, { backgroundColor: color }]}>
      <Icon icon={icon} size={18} color={colors.onSolid} weight="fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  }
});
