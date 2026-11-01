import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps
} from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import {
  createContext,
  use,
  useCallback,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject
} from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeEventSubscription
} from 'react-native';

import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useWindowInsets } from '@/feature/common/helpers/use-window-insets';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Text } from './text';

const TALL_SNAP_POINTS = ['90%'];

export type SheetRef = { present: () => void; dismiss: () => void };

const SheetDismissContext = createContext<(() => void) | null>(null);

/** Dismisses the enclosing sheet, for parts that close it after an action. */
export function useSheetDismiss() {
  const dismiss = use(SheetDismissContext);
  if (!dismiss) throw new Error('useSheetDismiss must be used inside Sheet');

  return dismiss;
}

export function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
  );
}

/** Tracks whether the sheet is open, and while it is, closes it on the Android back button or when its screen loses focus. */
function useSheetLifecycle(modal: RefObject<BottomSheetModal | null>) {
  const subscription = useRef<NativeEventSubscription | null>(null);
  const isOpen = useRef(false);

  useFocusEffect(
    useCallback(
      () => () => {
        if (isOpen.current) modal.current?.dismiss();
      },
      [modal]
    )
  );

  const onChange: NonNullable<BottomSheetModalProps['onChange']> = (index) => {
    isOpen.current = index >= 0;

    if (index >= 0 && !subscription.current) {
      subscription.current = BackHandler.addEventListener('hardwareBackPress', () => {
        modal.current?.dismiss();
        return true;
      });
      return;
    }

    if (index < 0) {
      subscription.current?.remove();
      subscription.current = null;
    }
  };

  return onChange;
}

type SheetProps = {
  ref?: Ref<SheetRef>;
  /** `fit` sizes to its content and scrolls past 90% of the screen; `tall` always takes 90%, for lists and chats that fill the space. */
  size?: 'fit' | 'tall';
  /** Runs once the sheet has finished closing, however it was closed. */
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * A gorhom modal sheet. Present and dismiss it through its ref (`sheet.current?.present()`). It closes on a backdrop
 * tap, a downward drag or the Android back button.
 */
export function Sheet({ ref, size = 'fit', onDismiss, children }: SheetProps) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useWindowInsets();
  const modal = useRef<BottomSheetModal>(null);
  const onChange = useSheetLifecycle(modal);
  const dismiss = () => modal.current?.dismiss();

  useImperativeHandle(ref, () => ({
    present: () => modal.current?.present(),
    dismiss: () => modal.current?.dismiss()
  }));

  return (
    <BottomSheetModal
      ref={modal}
      enableDynamicSizing={size === 'fit'}
      snapPoints={size === 'tall' ? TALL_SNAP_POINTS : undefined}
      maxDynamicContentSize={height * 0.9 - insets.top}
      topInset={insets.top}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={onChange}
      onDismiss={onDismiss}
      backdropComponent={SheetBackdrop}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.borderStrong }]}
      accessibilityViewIsModal
    >
      <SheetDismissContext value={dismiss}>
        {size === 'tall' ? (
          <View style={styles.fill}>{children}</View>
        ) : (
          <BottomSheetScrollView
            alwaysBounceVertical={false}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, SPACING.md) }}
          >
            {children}
          </BottomSheetScrollView>
        )}
      </SheetDismissContext>
    </BottomSheetModal>
  );
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function SheetHeading({ children }: { children: ReactNode }) {
  return <View style={styles.heading}>{children}</View>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" accessibilityRole="header" numberOfLines={2}>
      {children}
    </Text>
  );
}

export function SheetDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" numberOfLines={3}>
      {children}
    </Text>
  );
}

export function SheetClose() {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const dismiss = useSheetDismiss();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('close')}
      hitSlop={HIT_SLOP}
      onPress={dismiss}
      style={({ pressed }) => [styles.close, { backgroundColor: pressed ? colors.mutedStrong : colors.muted }]}
    >
      <Icon icon={XIcon} size={16} tone="muted" weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { borderRadius: RADII.sheet + 6, borderCurve: 'continuous' },
  indicator: { width: 36, height: 4, borderRadius: RADII.pill },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    paddingHorizontal: GUTTER
  },
  heading: { flex: 1, gap: SPACING.xxs / 2 },
  close: { width: 30, height: 30, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 }
});
