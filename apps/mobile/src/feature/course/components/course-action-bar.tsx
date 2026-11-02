import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

/** Bar pinned under the scrolling content for the screen's primary action. Sits in the layout, so it never covers content. */
export function CourseActionBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACING.sm) + SPACING.xxs
        }
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: GUTTER, paddingTop: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth * 2 }
});
