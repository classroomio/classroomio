import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountQuery } from '@/feature/account/api/account';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { biometricIconOf } from '@/feature/biometric/helpers/biometric-icon';
import { authenticateWithBiometrics } from '@/feature/biometric/helpers/biometric-support';
import { useBiometricSupport } from '@/feature/biometric/helpers/use-biometric-support';
import { Logo } from '@/feature/brand/components/logo';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION } from '@/feature/common/constants/motion';
import { errorHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useBiometricCopy } from '@/feature/biometric/helpers/use-biometric-copy';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const account = useAccountQuery();
  const support = useBiometricSupport();
  const inFlight = useRef(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, cancelLabel, signOut: signOutLabel, failureMessage } = useBiometricCopy(support.data?.method);
  const glyph = biometricIconOf(support.data?.kind);
  const email = account.data?.profile.email;

  const unlock = async () => {
    if (inFlight.current) return;

    inFlight.current = true;
    setAuthenticating(true);
    setError(null);
    const result = await authenticateWithBiometrics({ promptMessage: t('unlockPrompt'), cancelLabel });
    inFlight.current = false;
    setAuthenticating(false);

    if (result.success) {
      onUnlock();
      return;
    }

    if (result.failure) {
      errorHaptic();
      setError(failureMessage(result.failure));
    }
  };

  const leave = async () => {
    setSigningOut(true);
    await signOut();
  };

  useEffect(() => {
    void unlock();
  }, []);

  return (
    <Animated.View
      exiting={FadeOut.duration(DURATION.base)}
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + SPACING.xxxl,
          paddingBottom: insets.bottom + SPACING.lg
        }
      ]}
    >
      <View style={styles.logo}>
        <Logo size={24} />
      </View>

      <View style={styles.body}>
        <View style={[styles.glyph, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon icon={glyph} size={28} tone="ink" />
        </View>
        <View style={styles.copy}>
          <Text variant="title" accessibilityRole="header" style={styles.centered}>
            {t('lockedTitle')}
          </Text>
          <Text tone="muted" style={styles.centered}>
            {email ? t('lockedDescriptionWithEmail', { email }) : t('lockedDescription')}
          </Text>
        </View>
        {error && (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite" style={styles.centered}>
            {error}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button size="lg" disabled={authenticating || signingOut} onPress={unlock}>
          {authenticating ? (
            <ButtonSpinner />
          ) : (
            <>
              <ButtonIcon icon={glyph} />
              <ButtonText>{t('unlockWith')}</ButtonText>
            </>
          )}
        </Button>
        <Button variant="ghost" disabled={signingOut} onPress={leave}>
          {signingOut ? <ButtonSpinner /> : <ButtonText>{signOutLabel}</ButtonText>}
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { zIndex: 1000, paddingHorizontal: GUTTER, alignItems: 'stretch' },
  logo: { alignSelf: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  glyph: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  copy: { gap: SPACING.xs, maxWidth: 320 },
  centered: { textAlign: 'center' },
  actions: { gap: SPACING.xs }
});
