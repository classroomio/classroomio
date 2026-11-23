import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { StyleSheet } from 'react-native';

import { assistantCatalog } from '@/feature/assistant/translations/catalog';
import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** The floating Ask AI button on Home, anchored above the tab bar. */
export function AskAiButton({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const t = useTranslations(assistantCatalog);
  const { colors, elevation } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('title')}
      accessibilityHint={t('description')}
      scaleTo={0.96}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={[styles.button, elevation.floating, { backgroundColor: colors.primary, bottom }]}
    >
      <Icon icon={SparkleIcon} size={18} color={colors.onPrimary} weight="fill" />
      <Text variant="label" tone="onPrimary">
        {t('title')}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill
  }
});
