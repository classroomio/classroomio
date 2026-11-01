import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Keyframe } from 'react-native-reanimated';

import type { AppIcon } from '@/feature/common/components/icon';
import { IconTile, type IconTileTone } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';

const MEDIA_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.94 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
}).duration(240);

/** A centred result: a solid icon tile, a title, supporting lines and the next actions. */
export function CheckInOutcome({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(200).easing(EASE_OUT)} style={styles.root}>
      {children}
    </Animated.View>
  );
}

export function CheckInOutcomeMedia({ icon, tone }: { icon: AppIcon; tone: IconTileTone }) {
  return (
    <Animated.View entering={MEDIA_ENTER} style={styles.media}>
      <IconTile icon={icon} tone={tone} size={72} />
    </Animated.View>
  );
}

export function CheckInOutcomeTitle({ children }: { children: string }) {
  return (
    <Text variant="title" accessibilityRole="header" style={styles.centered}>
      {children}
    </Text>
  );
}

export function CheckInOutcomeDetails({ children }: { children: ReactNode }) {
  return <View style={styles.details}>{children}</View>;
}

export function CheckInOutcomeActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: SPACING.md },
  media: { marginBottom: SPACING.xs },
  centered: { textAlign: 'center' },
  details: { alignItems: 'center', gap: SPACING.xxs },
  actions: { alignSelf: 'stretch', gap: SPACING.xs, marginTop: SPACING.lg }
});
