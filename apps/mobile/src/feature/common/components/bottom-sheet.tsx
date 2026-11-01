import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView as GorhomScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useModalPresentation } from '@/feature/common/helpers/use-modal-presentation';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Text } from './text';

const TALL_SNAP_POINTS = ['90%'];

type BottomSheetContextValue = { open: boolean; close: () => void };

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function useBottomSheet() {
  const context = use(BottomSheetContext);
  if (!context) throw new Error('BottomSheet parts must be used inside BottomSheet');

  return context;
}

type BottomSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

/** A modal sheet (gorhom bottom sheet) that closes on backdrop tap, back press or a downward drag. */
export function BottomSheet({ open, onOpenChange, children }: BottomSheetProps) {
  return <BottomSheetContext value={{ open, close: () => onOpenChange(false) }}>{children}</BottomSheetContext>;
}

export function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
  );
}

/** Presents sheets above native tab and stack views, which otherwise cover the portal host on iOS. */
export function SheetContainer({ children }: { children?: ReactNode }) {
  if (Platform.OS !== 'ios') return children;

  return (
    <FullWindowOverlay>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>{children}</GestureHandlerRootView>
    </FullWindowOverlay>
  );
}

type BottomSheetContentProps = {
  /** `fit` grows with its content up to 90% of the screen; `tall` always takes 90%, for lists and chats that fill the space. */
  size?: 'fit' | 'tall';
  children: ReactNode;
};

export function BottomSheetContent({ size = 'fit', children }: BottomSheetContentProps) {
  const { colors } = useTheme();
  const { open, close } = useBottomSheet();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { modal, markDismissed } = useModalPresentation(open);

  return (
    <BottomSheetModal
      ref={modal}
      onDismiss={() => {
        markDismissed();
        close();
      }}
      enableDynamicSizing={size === 'fit'}
      snapPoints={size === 'tall' ? TALL_SNAP_POINTS : undefined}
      maxDynamicContentSize={height * 0.9 - insets.top}
      topInset={insets.top}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={SheetBackdrop}
      containerComponent={SheetContainer}
      backgroundStyle={[styles.background, { backgroundColor: colors.background, borderColor: colors.border }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.borderStrong }]}
      accessibilityViewIsModal
    >
      <BottomSheetContext value={{ open, close }}>
        {size === 'tall' ? (
          <View style={styles.fill}>{children}</View>
        ) : (
          <BottomSheetView style={{ paddingBottom: insets.bottom }}>{children}</BottomSheetView>
        )}
      </BottomSheetContext>
    </BottomSheetModal>
  );
}

export function BottomSheetHeader({ children }: { children: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>{children}</View>
    </View>
  );
}

export function BottomSheetHeading({ children }: { children: ReactNode }) {
  return <View style={styles.heading}>{children}</View>;
}

export function BottomSheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" accessibilityRole="header" numberOfLines={1}>
      {children}
    </Text>
  );
}

export function BottomSheetDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" numberOfLines={2}>
      {children}
    </Text>
  );
}

export function BottomSheetClose() {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { close } = useBottomSheet();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('close')}
      hitSlop={HIT_SLOP}
      onPress={close}
      style={({ pressed }) => [styles.close, { backgroundColor: pressed ? colors.sandStrong : colors.sand }]}
    >
      <Icon icon={X} size={17} tone="muted" />
    </Pressable>
  );
}

type BottomSheetScrollViewProps = ComponentProps<typeof GorhomScrollView>;

/** Scrolls inside a sheet and hands the drag to the sheet at the top edge. */
export function BottomSheetScrollView({ contentContainerStyle, ...props }: BottomSheetScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <GorhomScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + SPACING.lg }, contentContainerStyle]}
    />
  );
}

export function BottomSheetBody({ children }: { children: ReactNode }) {
  return <View style={styles.fill}>{children}</View>;
}

/** Closes the sheet from inside a custom part, for example after an action that leaves the sheet. */
export function useBottomSheetClose() {
  return useBottomSheet().close;
}

const styles = StyleSheet.create({
  background: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderCurve: 'continuous'
  },
  indicator: { width: 36, height: 5, borderRadius: RADII.pill },
  header: { paddingTop: SPACING.xxs, paddingBottom: SPACING.sm, paddingHorizontal: GUTTER },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  heading: { flex: 1, gap: 1 },
  close: { width: 30, height: 30, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: GUTTER, gap: SPACING.xs },
  fill: { flex: 1 }
});
