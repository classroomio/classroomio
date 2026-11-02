import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { SsoForm } from '@/feature/auth/components/sso-form';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function SsoScreen() {
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
      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t('signInWithSso')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('ssoSubtitle')}
        </Text>
      </View>
      <SsoForm initialEmail={email} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  heading: { gap: SPACING.xxs }
});
