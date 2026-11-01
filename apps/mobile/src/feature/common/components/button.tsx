import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { HIT_SLOP, RADII } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon, type AppIcon } from './icon';
import { PressableScale } from './pressable-scale';
import { Spinner } from './spinner';
import { Text, TextStyleContext, type TextTone } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'icon';

const LABEL_TONE: Record<ButtonVariant, TextTone> = {
  primary: 'onPrimary',
  secondary: 'ink',
  outline: 'ink',
  ghost: 'ink',
  destructive: 'onPrimary'
};

const ICON_SIZE: Record<ButtonSize, number> = { lg: 20, md: 18, sm: 16, icon: 20 };

const ButtonContext = createContext<{ variant: ButtonVariant; size: ButtonSize }>({ variant: 'primary', size: 'md' });

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  haptic = true,
  disabled,
  onPress,
  style,
  children,
  ...props
}: ButtonProps) {
  const { colors, elevation } = useTheme();

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary, ...elevation.raised },
    secondary: { backgroundColor: colors.mutedStrong },
    outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...elevation.raised },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: colors.danger, ...elevation.raised }
  };

  return (
    <ButtonContext value={{ variant, size }}>
      <TextStyleContext value={{ variant: size === 'sm' ? 'captionStrong' : 'label', tone: LABEL_TONE[variant] }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(disabled) }}
          hitSlop={size === 'sm' || size === 'icon' ? HIT_SLOP : undefined}
          disabled={disabled}
          onPress={(event) => {
            if (haptic) tapHaptic();
            onPress?.(event);
          }}
          {...props}
          style={[styles.base, styles[size], surface[variant], disabled && styles.disabled, style]}
        >
          {children}
        </PressableScale>
      </TextStyleContext>
    </ButtonContext>
  );
}

export function ButtonText({ children }: { children: ReactNode }) {
  return <Text numberOfLines={1}>{children}</Text>;
}

export function ButtonIcon({ icon }: { icon: AppIcon }) {
  const { size } = use(ButtonContext);

  return <Icon icon={icon} size={ICON_SIZE[size]} />;
}

export function ButtonSpinner() {
  const { variant } = use(ButtonContext);

  return <Spinner tone={LABEL_TONE[variant]} />;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  lg: { minHeight: 52, paddingHorizontal: 20 },
  md: { minHeight: 44, paddingHorizontal: 16 },
  sm: { minHeight: 34, paddingHorizontal: 12, borderRadius: RADII.input },
  icon: { width: 44, height: 44 },
  disabled: { opacity: 0.45 }
});
