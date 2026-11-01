import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSsoDiscovery } from '@/feature/auth/api/sso';
import { emailDomainOf, isEmail } from '@/feature/auth/helpers/email';
import { useSsoSignIn } from '@/feature/auth/helpers/use-sso-sign-in';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { SPACING } from '@/feature/common/constants/layout';
import { errorHaptic } from '@/feature/common/helpers/haptics';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function SsoForm({ initialEmail = '' }: { initialEmail?: string }) {
  const discover = useSsoDiscovery();
  const t = useTranslations(authCatalog);
  const tc = useTranslations(commonCatalog);
  const ssoSignIn = useSsoSignIn();
  const [email, setEmail] = useState(initialEmail);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedEmail = email.trim();
  const busy = checking || ssoSignIn.pending;
  const shownError = error ?? ssoSignIn.error;

  const submit = async () => {
    if (busy) return;

    if (!isEmail(trimmedEmail)) {
      setError(t('workEmailInvalid'));
      return;
    }

    setChecking(true);
    setError(null);
    ssoSignIn.clearError();

    try {
      const discovery = await discover(trimmedEmail);
      setChecking(false);

      if (!discovery.ssoAvailable) {
        errorHaptic();
        setError(t('ssoNotSetUp', { domain: emailDomainOf(trimmedEmail) }));
        return;
      }

      await ssoSignIn.start(trimmedEmail, discovery.providerId, discovery.providerName);
    } catch (cause) {
      setChecking(false);
      errorHaptic();
      setError(errorMessage(cause));
    }
  };

  return (
    <View style={styles.form}>
      <Field invalid={Boolean(shownError)}>
        <FieldLabel>{t('workEmailLabel')}</FieldLabel>
        <Input
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="go"
          onSubmitEditing={submit}
          autoFocus={!initialEmail}
        />
        {shownError ? (
          <FieldError>{shownError}</FieldError>
        ) : (
          <FieldDescription>{t('ssoBrowserNote')}</FieldDescription>
        )}
      </Field>
      <Button size="lg" disabled={!trimmedEmail || busy} onPress={submit}>
        {busy ? <ButtonSpinner /> : <ButtonText>{tc('continue')}</ButtonText>}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg }
});
