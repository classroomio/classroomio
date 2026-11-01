import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Text, type TextProps } from './text';

type CardProps = ViewProps & { style?: StyleProp<ViewStyle> };

export function Card({ style, ...props }: CardProps) {
  const { colors, elevation } = useTheme();

  return (
    <View
      {...props}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised, style]}
    />
  );
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.header, style]} />;
}

export function CardTitle(props: TextProps) {
  return <Text variant="heading" accessibilityRole="header" {...props} />;
}

export function CardDescription(props: TextProps) {
  return <Text variant="caption" tone="muted" {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.content, style]} />;
}

export function CardFooter({ style, ...props }: ViewProps & { children: ReactNode }) {
  const { colors } = useTheme();

  return <View {...props} style={[styles.footer, { borderTopColor: colors.border }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  header: { gap: 2, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  content: { padding: SPACING.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  }
});
