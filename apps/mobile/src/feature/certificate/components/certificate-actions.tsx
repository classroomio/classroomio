import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

export function CertificateActions({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

type CertificateActionProps = {
  icon: AppIcon;
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

/** One action as an icon over its label, in the row of certificate actions. */
export function CertificateAction({ icon, label, onPress, busy = false, disabled = false }: CertificateActionProps) {
  const { colors } = useTheme();
  const inactive = disabled || busy;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      scaleTo={0.96}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={[
        styles.action,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: disabled ? 0.5 : 1 }
      ]}
    >
      <View style={[styles.glyph, { backgroundColor: colors.primaryTint }]}>
        {busy ? <Spinner size="small" /> : <Icon icon={icon} size={20} tone="primary" weight="fill" />}
      </View>
      <Text variant="captionStrong" numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.xs },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  glyph: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill
  }
});
