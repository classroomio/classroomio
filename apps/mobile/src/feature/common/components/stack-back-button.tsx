import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { HIT_SLOP } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';

/** Back button for the first screen of a nested stack, which the native header leaves without one. */
export function StackBackButton({ tintColor }: { tintColor?: string }) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('back')}
      hitSlop={HIT_SLOP}
      onPress={() => router.back()}
      style={styles.button}
    >
      <Icon icon={ChevronLeft} size={26} color={tintColor ?? colors.primary} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }
});
