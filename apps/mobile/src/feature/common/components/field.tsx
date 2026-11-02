import { createContext, use, useId, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { SPACING } from '@/feature/common/constants/layout';

import { Text } from './text';

type FieldContextValue = { invalid: boolean; disabled: boolean; labelId: string };

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useField() {
  return use(FieldContext);
}

type FieldProps = ViewProps & { invalid?: boolean; disabled?: boolean };

export function Field({ invalid = false, disabled = false, style, ...props }: FieldProps) {
  const labelId = useId();

  return (
    <FieldContext value={{ invalid, disabled, labelId }}>
      <View {...props} style={[styles.field, style]} />
    </FieldContext>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  const field = useField();

  return (
    <Text variant="captionStrong" nativeID={field?.labelId}>
      {children}
    </Text>
  );
}

export function FieldDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted">
      {children}
    </Text>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACING.xs - 2 }
});
