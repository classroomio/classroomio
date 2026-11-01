import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Item, ItemActions, ItemChevron, ItemContent, ItemGroup } from '@/feature/common/components/item';
import { ScreenSection } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import type { ContentItemState } from '@/feature/course/types/course-detail';

export function OutlineSection({ children }: { children: ReactNode }) {
  return <ScreenSection>{children}</ScreenSection>;
}

export function OutlineSectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="subheading" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {meta ? (
        <Text variant="caption" tone="muted">
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

export function OutlineList({ children }: { children: ReactNode }) {
  return <ItemGroup>{children}</ItemGroup>;
}

const OutlineRowContext = createContext<ContentItemState>('available');

type OutlineRowProps = Pick<PressableProps, 'onPress' | 'accessibilityLabel' | 'accessibilityHint'> & {
  state: ContentItemState;
  children: ReactNode;
};

export function OutlineRow({ state, onPress, accessibilityLabel, accessibilityHint, children }: OutlineRowProps) {
  const { colors } = useTheme();
  const style = state === 'current' ? [styles.current, { backgroundColor: colors.primaryTint }] : undefined;

  return (
    <OutlineRowContext value={state}>
      {state !== 'locked' && onPress ? (
        <Item
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ selected: state === 'current' }}
          style={style}
        >
          {children}
        </Item>
      ) : (
        <View accessible accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: state === 'locked' }}>
          <Item style={style}>{children}</Item>
        </View>
      )}
    </OutlineRowContext>
  );
}

/** The leading tile: a check, play or lock glyph for those states, otherwise the item's own icon. Only the next item is solid. */
export function OutlineRowIndicator({ icon }: { icon: AppIcon }) {
  const { colors } = useTheme();
  const state = use(OutlineRowContext);

  if (state === 'current') {
    return (
      <View style={[styles.indicator, { backgroundColor: colors.primary }]}>
        <Icon icon={PlayIcon} size={16} color={colors.onPrimary} weight="fill" />
      </View>
    );
  }

  if (state === 'complete') {
    return (
      <View style={[styles.indicator, { backgroundColor: colors.successTint }]}>
        <Icon icon={CheckIcon} size={17} tone="success" weight="bold" />
      </View>
    );
  }

  return (
    <View style={[styles.indicator, { backgroundColor: colors.muted }]}>
      <Icon icon={state === 'locked' ? LockIcon : icon} size={17} tone={state === 'locked' ? 'subtle' : 'muted'} />
    </View>
  );
}

export function OutlineRowContent({ children }: { children: ReactNode }) {
  return <ItemContent>{children}</ItemContent>;
}

export function OutlineRowTitle({ children }: { children: ReactNode }) {
  const state = use(OutlineRowContext);

  return (
    <Text variant="bodyStrong" tone={state === 'locked' ? 'muted' : 'ink'} numberOfLines={2}>
      {children}
    </Text>
  );
}

export function OutlineRowDescription({
  children,
  tone
}: {
  children: ReactNode;
  tone?: 'muted' | 'primary' | 'warning';
}) {
  const state = use(OutlineRowContext);

  return (
    <Text variant="caption" tone={tone ?? (state === 'current' ? 'primary' : 'muted')} numberOfLines={2}>
      {children}
    </Text>
  );
}

export function OutlineRowActions({ children }: { children?: ReactNode }) {
  const state = use(OutlineRowContext);

  return (
    <ItemActions>
      {children}
      {state !== 'locked' && !children ? <ItemChevron /> : null}
    </ItemActions>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 12, minHeight: 24 },
  sectionTitle: { flex: 1 },
  current: { minHeight: 68 },
  indicator: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  }
});
