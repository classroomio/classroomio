import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { leaveCheckIn } from '@/feature/check-in/helpers/leave-check-in';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function CheckInBackButton() {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('back')}
      hitSlop={HIT_SLOP}
      onPress={leaveCheckIn}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon icon={CaretLeftIcon} size={26} color={colors.primary} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.45 }
});
