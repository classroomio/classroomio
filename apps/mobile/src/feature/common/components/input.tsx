import { createContext, use, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { TEXT_VARIANTS } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { useField } from './field';

const InputGroupContext = createContext<(focused: boolean) => void>(() => {});

type InputGroupProps = { style?: StyleProp<ViewStyle>; children: ReactNode };

export function InputGroup({ style, children }: InputGroupProps) {
  const { colors } = useTheme();
  const field = useField();
  const [focused, setFocused] = useState(false);
  const invalid = field?.invalid ?? false;
  const borderColor = invalid ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <InputGroupContext value={setFocused}>
      <View
        style={[
          styles.group,
          { backgroundColor: colors.surface, borderColor },
          focused && {
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 0,
                blurRadius: 0,
                spreadDistance: 3,
                color: invalid ? colors.dangerTint : colors.primaryTint
              }
            ]
          },
          field?.disabled && styles.disabled,
          style
        ]}
      >
        {children}
      </View>
    </InputGroupContext>
  );
}

type InputGroupInputProps = TextInputProps & { ref?: Ref<ComponentRef<typeof TextInput>> };

export function InputGroupInput({ onFocus, onBlur, style, editable, ...props }: InputGroupInputProps) {
  const { colors } = useTheme();
  const field = useField();
  const setFocused = use(InputGroupContext);

  return (
    <TextInput
      placeholderTextColor={colors.inkSubtle}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      accessibilityLabelledBy={field?.labelId}
      editable={editable ?? !field?.disabled}
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[styles.input, { color: colors.ink }, style]}
    />
  );
}

export function InputGroupAddon({ children }: { children: ReactNode }) {
  return <View style={styles.addon}>{children}</View>;
}

export function Input(props: InputGroupInputProps) {
  return (
    <InputGroup>
      <InputGroupInput {...props} />
    </InputGroup>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  },
  input: {
    ...TEXT_VARIANTS.body,
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm
  },
  addon: { flexDirection: 'row', alignItems: 'center', paddingRight: SPACING.xxs },
  disabled: { opacity: 0.55 }
});
