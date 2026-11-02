import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Item, ItemGroup } from '@/feature/common/components/item';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';

export function CertificateFacts({ children }: { children: ReactNode }) {
  return <ItemGroup>{children}</ItemGroup>;
}

type CertificateFactProps = { label: string; value: string; action?: ReactNode };

export function CertificateFact({ label, value, action }: CertificateFactProps) {
  return (
    <Item style={styles.fact}>
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
      <View style={styles.value}>
        <Text variant="body" selectable style={styles.valueText}>
          {value}
        </Text>
        {action}
      </View>
    </Item>
  );
}

const styles = StyleSheet.create({
  fact: { minHeight: 48, paddingVertical: SPACING.xs + 2 },
  label: { width: 112 },
  value: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.xs },
  valueText: { flexShrink: 1, textAlign: 'right' }
});
