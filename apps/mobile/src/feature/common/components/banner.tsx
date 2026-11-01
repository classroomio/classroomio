import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/feature/common/constants/colors';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon, type AppIcon } from './icon';
import { PressableScale } from './pressable-scale';
import { Text, type TextTone } from './text';

export type BannerTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

const TONE_TEXT: Record<BannerTone, TextTone> = {
  neutral: 'muted',
  info: 'primary',
  warning: 'warning',
  danger: 'danger',
  success: 'success'
};

const TONE_SURFACE: Record<BannerTone, keyof ThemeColors> = {
  neutral: 'muted',
  info: 'primaryTint',
  warning: 'warningTint',
  danger: 'dangerTint',
  success: 'successTint'
};

const BannerContext = createContext<BannerTone>('neutral');

type BannerProps = Pick<PressableProps, 'accessibilityLabel' | 'accessibilityHint' | 'onPress'> & {
  tone?: BannerTone;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Banner({
  tone = 'neutral',
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children
}: BannerProps) {
  const { colors } = useTheme();
  const surface = [styles.banner, { backgroundColor: colors[TONE_SURFACE[tone]], borderColor: colors.border }, style];

  return (
    <BannerContext value={tone}>
      {onPress ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          scaleTo={0.985}
          onPress={(event) => {
            tapHaptic();
            onPress(event);
          }}
          style={surface}
        >
          {children}
        </PressableScale>
      ) : (
        <View
          accessible={Boolean(accessibilityLabel)}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
          style={surface}
        >
          {children}
        </View>
      )}
    </BannerContext>
  );
}

export function BannerIcon({ icon }: { icon: AppIcon }) {
  const tone = use(BannerContext);

  return (
    <View style={styles.icon}>
      <Icon icon={icon} size={18} tone={TONE_TEXT[tone]} />
    </View>
  );
}

export function BannerContent({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

export function BannerTitle({ children }: { children: ReactNode }) {
  const tone = use(BannerContext);

  return (
    <Text variant="captionStrong" tone={tone === 'neutral' ? 'ink' : TONE_TEXT[tone]}>
      {children}
    </Text>
  );
}

export function BannerDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="body">
      {children}
    </Text>
  );
}

export function BannerChevron() {
  return (
    <View style={styles.chevron}>
      <Icon icon={CaretRightIcon} size={18} tone="subtle" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm - 2,
    padding: SPACING.sm,
    paddingRight: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  icon: { paddingTop: 1 },
  content: { flex: 1, gap: 2 },
  chevron: { alignSelf: 'center' }
});
