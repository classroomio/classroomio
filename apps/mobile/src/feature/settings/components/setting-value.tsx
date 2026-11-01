import { StyleSheet } from 'react-native';

import { Text } from '@/feature/common/components/text';

export function SettingValue({ children }: { children: string }) {
  return (
    <Text tone="muted" numberOfLines={1} style={styles.value}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  value: { maxWidth: 200, textAlign: 'right' }
});
