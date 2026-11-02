import { StyleSheet } from 'react-native';

import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';

/** Explanatory text set under a settings group. */
export function SettingsFootnote({ children }: { children: string }) {
  return (
    <Text variant="caption" tone="muted" style={styles.footnote}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  footnote: { paddingHorizontal: SPACING.md }
});
