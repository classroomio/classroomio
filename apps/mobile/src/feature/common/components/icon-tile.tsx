import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

export type IconTileTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type IconTileProps = { icon: AppIcon; tone?: IconTileTone; size?: number };

/** A glyph on a rounded tile. Neutral by default; a tone tints it only when the colour carries meaning. */
export function IconTile({ icon, tone = 'neutral', size = 32 }: IconTileProps) {
  const { colors } = useTheme();
  const palette = {
    neutral: { background: colors.muted, glyph: colors.ink },
    primary: { background: colors.primaryTint, glyph: colors.primaryText },
    success: { background: colors.successTint, glyph: colors.success },
    warning: { background: colors.warningTint, glyph: colors.warning },
    danger: { background: colors.dangerTint, glyph: colors.danger }
  }[tone];

  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: palette.background }]}>
      <Icon icon={icon} size={Math.round(size * 0.56)} color={palette.glyph} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderRadius: RADII.input, borderCurve: 'continuous' }
});
