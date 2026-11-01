import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Text } from './text';

type ScreenScrollViewProps = ScrollViewProps & {
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenScrollView({
  refreshing,
  onRefresh,
  contentContainerStyle,
  style,
  ...props
}: ScreenScrollViewProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.inkMuted} />
        ) : undefined
      }
      {...props}
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    />
  );
}

export function ScreenSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

type ScreenSectionHeaderProps = { title: string; action?: ReactNode };

export function ScreenSectionHeader({ title, action }: ScreenSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="subheading" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl, gap: SPACING.xl },
  section: { gap: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }
});
