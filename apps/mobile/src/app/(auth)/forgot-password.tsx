import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ForgotPasswordForm } from '@/feature/auth/components/forgot-password-form';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const t = useTranslations(authCatalog);

  return (
    <KeyboardAwareScrollView
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text variant="title" accessibilityRole="header">
        {t('resetTitle')}
      </Text>
      <ForgotPasswordForm initialEmail={email} onDone={() => router.back()} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, gap: SPACING.lg }
});
