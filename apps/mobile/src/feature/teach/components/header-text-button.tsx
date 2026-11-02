import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/feature/common/components/text';
import { HIT_SLOP } from '@/feature/common/constants/layout';

type HeaderTextButtonProps = { onPress: () => void; disabled?: boolean; strong?: boolean; children: string };

export function HeaderTextButton({ onPress, disabled = false, strong = false, children }: HeaderTextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dim]}
    >
      <Text variant={strong ? 'label' : 'body'} tone="primary">
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  dim: { opacity: 0.5 }
});
