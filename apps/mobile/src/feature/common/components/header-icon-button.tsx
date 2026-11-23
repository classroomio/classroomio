import { Pressable, StyleSheet } from 'react-native';

import { HIT_SLOP } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';

import { Icon, type AppIcon } from './icon';

type HeaderIconButtonProps = {
  icon: AppIcon;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  weight?: 'regular' | 'fill';
};

export function HeaderIconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  weight = 'regular'
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon icon={icon} size={22} tone="primary" weight={weight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.45 },
  disabled: { opacity: 0.4 }
});
