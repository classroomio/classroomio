import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '@/feature/common/constants/colors';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { THEME_OPTIONS } from '@/feature/settings/constants/settings';
import { setThemePreference, useThemePreference } from '@/feature/settings/helpers/theme-preference-store';
import { settingsCatalog } from '@/feature/settings/translations/catalog';
import type { ThemePreference } from '@/feature/settings/types/settings';

const PREVIEW_WIDTH = 72;
const PREVIEW_HEIGHT = 108;

function ScreenPreview({ palette }: { palette: ThemeColors }) {
  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.titleBar, { backgroundColor: palette.ink }]} />
      <View style={[styles.block, { backgroundColor: palette.muted, borderColor: palette.border }]} />
      <View style={[styles.line, { backgroundColor: palette.mutedStrong }]} />
      <View style={[styles.line, styles.lineShort, { backgroundColor: palette.mutedStrong }]} />
      <View style={[styles.button, { backgroundColor: palette.primary }]} />
    </View>
  );
}

function ThemePreview({ value }: { value: ThemePreference }) {
  if (value === 'light') return <ScreenPreview palette={LIGHT_COLORS} />;
  if (value === 'dark') return <ScreenPreview palette={DARK_COLORS} />;

  return (
    <View style={styles.split}>
      <ScreenPreview palette={LIGHT_COLORS} />
      <View style={styles.darkHalf}>
        <View style={styles.darkHalfInner}>
          <ScreenPreview palette={DARK_COLORS} />
        </View>
      </View>
    </View>
  );
}

/** System, light and dark as small screen previews; choosing one applies it at once. */
export function ThemePreferencePicker() {
  const t = useTranslations(settingsCatalog);
  const { colors } = useTheme();
  const preference = useThemePreference();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('theme')} style={styles.row}>
      {THEME_OPTIONS.map((option) => {
        const selected = option.value === preference;

        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(option.labelKey)}
            scaleTo={0.96}
            onPress={() => {
              if (selected) return;

              selectionHaptic();
              setThemePreference(option.value);
            }}
            style={styles.option}
          >
            <View style={[styles.frame, { borderColor: selected ? colors.primary : colors.border }]}>
              <ThemePreview value={option.value} />
            </View>
            <Text variant="captionStrong" tone={selected ? 'ink' : 'muted'}>
              {t(option.labelKey)}
            </Text>
            <Icon
              icon={selected ? CheckCircleIcon : CircleIcon}
              size={20}
              tone={selected ? 'primary' : 'subtle'}
              weight={selected ? 'fill' : 'regular'}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SPACING.md },
  option: { alignItems: 'center', gap: SPACING.xs },
  frame: {
    width: PREVIEW_WIDTH + 6,
    height: PREVIEW_HEIGHT + 6,
    padding: 1,
    borderWidth: 2,
    borderRadius: RADII.lg + 2,
    borderCurve: 'continuous',
    marginBottom: SPACING.xxs
  },
  split: { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, borderRadius: RADII.lg, overflow: 'hidden' },
  darkHalf: { position: 'absolute', top: 0, bottom: 0, left: PREVIEW_WIDTH / 2, right: 0, overflow: 'hidden' },
  darkHalfInner: { position: 'absolute', top: 0, left: -PREVIEW_WIDTH / 2 },
  screen: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    padding: 8,
    gap: 5,
    borderRadius: RADII.lg,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  titleBar: { width: '58%', height: 6, borderRadius: 3, marginBottom: 2 },
  block: { height: 30, borderRadius: 5, borderWidth: 1 },
  line: { height: 4, borderRadius: 2 },
  lineShort: { width: '64%' },
  button: { marginTop: 'auto', height: 10, borderRadius: 4 }
});
