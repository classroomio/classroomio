import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { savePendingInvite, type PendingInvite } from '@/feature/account/helpers/pending-invite-store';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { GoogleSignInButton } from '@/feature/auth/components/google-sign-in-button';
import { SignUpForm } from '@/feature/auth/components/sign-up-form';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { Logo } from '@/feature/brand/components/logo';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const DESCRIPTION_KEYS = {
  organization: 'signUpInviteOrganization',
  link: 'signUpInviteLink',
  resource: 'signUpInviteResource'
} as const;

/** An invite opened while signed out: create an account here, or sign in with an existing one. */
export function InviteSignUp({ invite }: { invite: PendingInvite }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations(accountCatalog);
  const auth = useTranslations(authCatalog);

  useEffect(() => {
    savePendingInvite({ kind: invite.kind, token: invite.token });
  }, [invite.kind, invite.token]);

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
          {t('signUpInviteTitle')}
        </Text>
        <Text tone="muted">{t(DESCRIPTION_KEYS[invite.kind])}</Text>
      </View>

      <SignUpForm />

      <View style={styles.divider}>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <Text variant="caption" tone="subtle">
          {auth('or')}
        </Text>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
      </View>

      <GoogleSignInButton />

      <View style={styles.spacer} />

      <Pressable accessibilityRole="link" hitSlop={HIT_SLOP} onPress={() => router.push('/')} style={styles.signInRow}>
        <Text variant="caption" tone="muted">
          {t('haveAccount')}
        </Text>
        <Text variant="captionStrong" tone="primary">
          {auth('signInTitle')}
        </Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: GUTTER, gap: SPACING.xl },
  heading: { gap: SPACING.xs, marginTop: SPACING.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  spacer: { flex: 1, minHeight: SPACING.xl },
  signInRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6 }
});
