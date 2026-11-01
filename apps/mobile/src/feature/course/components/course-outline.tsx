import { Check, Lock, Play, type LucideIcon } from 'lucide-react-native';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View, type PressableProps } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { Item, ItemActions, ItemChevron, ItemContent, ItemGroup } from '@/feature/common/components/item';
import { ScreenSection } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import type { ThemeColors } from '@/feature/common/constants/colors';
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
  const style = state === 'current' ? styles.current : undefined;

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

const INDICATOR: Record<
  ContentItemState,
  { surface: keyof ThemeColors; tone: 'success' | 'primary' | 'subtle' | 'muted' }
> = {
  complete: { surface: 'successTint', tone: 'success' },
  current: { surface: 'primaryTint', tone: 'primary' },
  locked: { surface: 'sand', tone: 'subtle' },
  available: { surface: 'sand', tone: 'muted' }
};

/** The leading tile: a check, play or lock glyph for those states, otherwise the item's own icon. */
export function OutlineRowIndicator({ icon }: { icon: LucideIcon }) {
  const { colors } = useTheme();
  const state = use(OutlineRowContext);
  const { surface, tone } = INDICATOR[state];
  const glyph = state === 'complete' ? Check : state === 'current' ? Play : state === 'locked' ? Lock : icon;

  return (
    <View style={[styles.indicator, { backgroundColor: colors[surface] }]}>
      <Icon icon={glyph} size={17} tone={tone} strokeWidth={state === 'complete' ? 2.4 : undefined} />
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
  current: { minHeight: 64 },
  indicator: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  }
});
