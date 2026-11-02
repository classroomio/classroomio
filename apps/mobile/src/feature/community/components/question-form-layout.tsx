import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function QuestionFormLayout({
  offlineDescription,
  children
}: {
  offlineDescription: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const offline = useIsOffline();
  const tc = useTranslations(commonCatalog);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={() => router.back()}>
              <Text variant="label" tone="primary">
                {tc('cancel')}
              </Text>
            </Pressable>
          )
        }}
      />
      {/* The native modal covers the root sheet host, so this screen hosts its own sheets. */}
      <BottomSheetModalProvider>
        <KeyboardAwareScrollView
          bottomOffset={32}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.content}
        >
          {offline ? <OfflineNotice description={offlineDescription} /> : null}
          {children}
        </KeyboardAwareScrollView>
      </BottomSheetModalProvider>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.lg, padding: GUTTER, paddingBottom: SPACING.xxxl }
});
