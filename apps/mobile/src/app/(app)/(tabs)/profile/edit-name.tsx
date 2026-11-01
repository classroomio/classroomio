import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useAccountQuery } from '@/feature/account/api/account';
import { EditNameForm } from '@/feature/account/components/edit-name-form';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function EditNameScreen() {
  const { colors } = useTheme();
  const account = useAccountQuery();
  const t = useTranslations(accountCatalog);

  return (
    <KeyboardAwareScrollView
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text variant="title" accessibilityRole="header">
        {t('editNameTitle')}
      </Text>
      <EditNameForm initialName={account.data?.profile.fullname ?? ''} onSaved={() => router.back()} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, gap: SPACING.lg }
});
