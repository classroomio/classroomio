import { HardDrivesIcon } from 'phosphor-react-native/src/icons/HardDrives';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/feature/auth/components/google-sign-in-button';
import { SignInForm } from '@/feature/auth/components/sign-in-form';
import { SsoSignInButton } from '@/feature/auth/components/sso-sign-in-button';
import { Logo } from '@/feature/brand/components/logo';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useServer } from '@/feature/server/components/server-provider';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { serverUrl } = useServer();
  const t = useTranslations(authCatalog);

  return (
    <KeyboardAwareScrollView
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.xxxl, paddingBottom: insets.bottom + SPACING.lg }
      ]}
    >
      <Logo size={26} />

      <View style={styles.heading}>
        <Text variant="display" accessibilityRole="header">
          {t('signInTitle')}
        </Text>
        <Text tone="muted">{t('signInSubtitle')}</Text>
      </View>

      <SignInForm />

      <View style={styles.divider}>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <Text variant="caption" tone="subtle">
          {t('or')}
        </Text>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.alternatives}>
        <GoogleSignInButton />
        <SsoSignInButton />
      </View>

      <View style={styles.spacer} />

      <Link href="/server" asChild>
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} style={styles.serverRow}>
          <Icon icon={HardDrivesIcon} size={15} tone="muted" />
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {new URL(serverUrl).host}
          </Text>
          <Text variant="captionStrong" tone="primary">
            {t('changeServer')}
          </Text>
        </Pressable>
      </Link>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: GUTTER, gap: SPACING.xl },
  heading: { gap: SPACING.xs, marginTop: SPACING.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  alternatives: { gap: SPACING.sm },
  spacer: { flex: 1, minHeight: SPACING.xl },
  serverRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6 }
});
