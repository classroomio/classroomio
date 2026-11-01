import { createContext, use } from 'react';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import type { ThemeColors } from '@/feature/common/constants/colors';
import { TEXT_VARIANTS, type TextVariant } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';

export type TextTone = 'ink' | 'body' | 'muted' | 'subtle' | 'primary' | 'onPrimary' | 'danger' | 'success' | 'warning';

const TONE_COLORS: Record<TextTone, keyof ThemeColors> = {
  ink: 'ink',
  body: 'inkBody',
  muted: 'inkMuted',
  subtle: 'inkSubtle',
  primary: 'primaryText',
  onPrimary: 'onPrimary',
  danger: 'danger',
  success: 'success',
  warning: 'warning'
};

type TextStyleValue = { variant?: TextVariant; tone?: TextTone };

export const TextStyleContext = createContext<TextStyleValue>({});

export function useTextColor(tone?: TextTone, color?: string) {
  const inherited = use(TextStyleContext);
  const { colors } = useTheme();

  return color ?? colors[TONE_COLORS[tone ?? inherited.tone ?? 'ink']];
}

export type TextProps = NativeTextProps & TextStyleValue & { color?: string };

export function Text({ variant, tone, color, style, ...props }: TextProps) {
  const inherited = use(TextStyleContext);
  const resolvedColor = useTextColor(tone, color);

  return (
    <NativeText
      maxFontSizeMultiplier={1.6}
      {...props}
      style={[TEXT_VARIANTS[variant ?? inherited.variant ?? 'body'], { color: resolvedColor }, style]}
    />
  );
}
