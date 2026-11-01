import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { HIT_SLOP } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';

import { Icon } from './icon';

type HeaderIconButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

export function HeaderIconButton({ icon, accessibilityLabel, onPress, disabled = false }: HeaderIconButtonProps) {
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
      style={[styles.button, disabled && styles.disabled]}
    >
      <Icon icon={icon} size={22} tone="primary" strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 }
});
