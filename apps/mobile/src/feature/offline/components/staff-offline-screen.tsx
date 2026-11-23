import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Empty, EmptyDescription, EmptyIllustration, EmptyTitle } from '@/feature/common/components/empty';
import { GUTTER } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { offlineCatalog } from '@/feature/offline/translations/catalog';

/** Shown to tutors and admins in place of the tabs while the device has no connection. */
export function StaffOfflineScreen() {
  const t = useTranslations(offlineCatalog);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <Empty>
        <EmptyIllustration name="offline" />
        <EmptyTitle>{t('staffOfflineTitle')}</EmptyTitle>
        <EmptyDescription>{t('staffOfflineDescription')}</EmptyDescription>
      </Empty>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: GUTTER }
});
