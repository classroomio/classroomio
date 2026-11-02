import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { communityCatalog } from '@/feature/community/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type FollowHeaderButtonProps = { following: boolean; disabled: boolean; onPress: () => void };

/** A bell in the navigation bar, filled while the member follows the question. */
export function FollowHeaderButton({ following, disabled, onPress }: FollowHeaderButtonProps) {
  const t = useTranslations(communityCatalog);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={following ? t('unfollowQuestion') : t('followQuestion')}
      accessibilityState={{ selected: following, disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon icon={BellSimpleIcon} size={22} tone="primary" weight={following ? 'fill' : 'regular'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.45 },
  disabled: { opacity: 0.4 }
});
