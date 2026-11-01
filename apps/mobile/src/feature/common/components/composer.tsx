import { Image } from 'expo-image';
import { ArrowUp, ImagePlus, WifiOff, X } from 'lucide-react-native';
import {
  createContext,
  use,
  useImperativeHandle,
  useRef,
  type ComponentRef,
  type ReactNode,
  type Ref,
  type RefObject
} from 'react';
import { Pressable, StyleSheet, TextInput, View, type ScrollViewProps, type TextInputProps } from 'react-native';
import {
  KeyboardChatScrollView,
  KeyboardStickyView,
  type KeyboardChatScrollViewRef
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { TEXT_VARIANTS } from '@/feature/common/constants/typography';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Spinner } from './spinner';
import { Text } from './text';

export type ComposerHandle = { focus: () => void; blur: () => void };

type ComposerContextValue = {
  value: string;
  onChangeText: (value: string) => void;
  submit: () => void;
  canSubmit: boolean;
  submitting: boolean;
  disabled: boolean;
  inputRef: RefObject<ComponentRef<typeof TextInput> | null>;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

function useComposer() {
  const context = use(ComposerContext);
  if (!context) throw new Error('Composer parts must be used inside Composer');

  return context;
}

type ComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  /** Blocks typing and sending, for example while offline. */
  disabled?: boolean;
  /** Overrides the default rule that a composer can send once it holds non-blank text. */
  canSubmit?: boolean;
  ref?: Ref<ComposerHandle>;
  children: ReactNode;
};

export function Composer({
  value,
  onChangeText,
  onSubmit,
  submitting = false,
  disabled = false,
  canSubmit,
  ref,
  children
}: ComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const ready = (canSubmit ?? value.trim().length > 0) && !submitting && !disabled;

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur()
  }));

  const submit = () => {
    if (!ready) return;

    tapHaptic();
    onSubmit();
  };

  return (
    <ComposerContext value={{ value, onChangeText, submit, canSubmit: ready, submitting, disabled, inputRef }}>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View
          style={[
            styles.bar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + SPACING.xs
            }
          ]}
        >
          {children}
        </View>
      </KeyboardStickyView>
    </ComposerContext>
  );
}

/** Scroll container for a list that sits above a Composer; keeps the end of the list visible as the keyboard opens. */
export function ComposerScrollView({ ref, ...props }: ScrollViewProps & { ref?: Ref<KeyboardChatScrollViewRef> }) {
  const insets = useSafeAreaInsets();

  return <KeyboardChatScrollView ref={ref} {...props} offset={insets.bottom} keyboardLiftBehavior="whenAtEnd" />;
}

export function ComposerReplyTarget({ name, onCancel }: { name: string; onCancel: () => void }) {
  const t = useTranslations(commonCatalog);
  const [before, after = ''] = t('replyingTo').split('{name}');

  return (
    <View style={styles.context}>
      <Text variant="caption" tone="muted" numberOfLines={1} style={styles.contextLabel}>
        {before}
        <Text variant="captionStrong">{name}</Text>
        {after}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('cancelReply')}
        hitSlop={HIT_SLOP}
        onPress={onCancel}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Icon icon={X} size={16} tone="muted" />
      </Pressable>
    </View>
  );
}

/** States why the composer is unavailable, in place of the input. */
export function ComposerNotice({ title, description }: { title: string; description: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.notice, { backgroundColor: colors.sand, borderColor: colors.border }]}>
      <Icon icon={WifiOff} size={18} tone="muted" />
      <View style={styles.noticeCopy}>
        <Text variant="captionStrong">{title}</Text>
        <Text variant="caption" tone="muted">
          {description}
        </Text>
      </View>
    </View>
  );
}

export function ComposerRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function ComposerInput(props: Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const { colors } = useTheme();
  const { value, onChangeText, disabled, inputRef } = useComposer();

  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        ref={inputRef}
        multiline
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        placeholderTextColor={colors.inkSubtle}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        textAlignVertical="center"
        {...props}
        style={[styles.input, { color: colors.ink }]}
      />
    </View>
  );
}

export function ComposerAttach({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  const t = useTranslations(commonCatalog);
  const composer = useComposer();
  const blocked = disabled || composer.disabled || composer.submitting;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('attachImage')}
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, blocked && styles.disabled]}
    >
      <Icon icon={ImagePlus} size={21} tone="muted" />
    </Pressable>
  );
}

export function ComposerSend({ accessibilityLabel }: { accessibilityLabel?: string }) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { submit, canSubmit, submitting } = useComposer();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t('send')}
      accessibilityState={{ disabled: !canSubmit, busy: submitting }}
      disabled={!canSubmit}
      hitSlop={HIT_SLOP}
      onPress={submit}
      style={({ pressed }) => [
        styles.send,
        { backgroundColor: canSubmit || submitting ? colors.primary : colors.sandStrong },
        pressed && styles.pressed
      ]}
    >
      {submitting ? (
        <Spinner tone="onPrimary" />
      ) : (
        <Icon icon={ArrowUp} size={19} tone={canSubmit ? 'onPrimary' : 'subtle'} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

export type ComposerAttachment = { key: string; uri: string; uploading: boolean };

export function ComposerAttachments({
  items,
  onRemove
}: {
  items: ComposerAttachment[];
  onRemove: (key: string) => void;
}) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  if (items.length === 0) return null;

  return (
    <View style={styles.attachments}>
      {items.map((item) => (
        <View key={item.key} style={[styles.thumb, { backgroundColor: colors.sand, borderColor: colors.border }]}>
          <Image source={{ uri: item.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          {item.uploading ? (
            <View style={[StyleSheet.absoluteFill, styles.thumbOverlay, { backgroundColor: colors.scrim }]}>
              <Spinner tone="onPrimary" />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('removeImage')}
              hitSlop={HIT_SLOP}
              onPress={() => onRemove(item.key)}
              style={({ pressed }) => [
                styles.remove,
                { backgroundColor: pressed ? colors.sand : colors.surface, borderColor: colors.border }
              ]}
            >
              <Icon icon={X} size={12} tone="ink" strokeWidth={2.4} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: SPACING.xs,
    paddingHorizontal: GUTTER - SPACING.xxs,
    paddingTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  context: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.xxs },
  contextLabel: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  noticeCopy: { flex: 1, gap: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.xs },
  field: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous'
  },
  input: {
    ...TEXT_VARIANTS.body,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 132,
    paddingHorizontal: SPACING.sm + 2,
    paddingTop: 10,
    paddingBottom: 10
  },
  iconButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  send: { width: 36, height: 36, marginBottom: 2, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, paddingHorizontal: SPACING.xxs },
  thumb: {
    width: 64,
    height: 64,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  thumbOverlay: { alignItems: 'center', justifyContent: 'center' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
