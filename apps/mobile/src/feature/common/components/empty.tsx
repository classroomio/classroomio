import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Illustration } from '@/feature/brand/components/illustration';
import type { IllustrationName } from '@/feature/brand/constants/illustration-scenes';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon, type AppIcon } from './icon';
import { Text } from './text';

export function Empty({ children }: { children: ReactNode }) {
  return <View style={styles.empty}>{children}</View>;
}

export function EmptyMedia({ icon }: { icon: AppIcon }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.media, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Icon icon={icon} size={22} tone="ink" />
    </View>
  );
}

type EmptyIllustrationProps = {
  name: IllustrationName;
  /** Height in points. */
  size?: number;
  /** Colour behind the empty state when it is not the screen background, such as a card or sheet. */
  surface?: string;
  animated?: boolean;
};

/** A brand line illustration in place of `EmptyMedia`, for first-run and all-clear states. */
export function EmptyIllustration({ name, size = 132, surface, animated = true }: EmptyIllustrationProps) {
  return <Illustration name={name} size={size} surface={surface} animated={animated} style={styles.illustration} />;
}

export function EmptyTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" style={styles.centered}>
      {children}
    </Text>
  );
}

export function EmptyDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" style={styles.centered}>
      {children}
    </Text>
  );
}

export function EmptyContent({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl },
  media: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    marginBottom: SPACING.xxs
  },
  illustration: { marginBottom: SPACING.xs },
  centered: { textAlign: 'center', maxWidth: 300 },
  content: { marginTop: SPACING.sm, alignSelf: 'stretch', alignItems: 'center' }
});
