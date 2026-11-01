import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { SsoRequiredNotice } from '@/feature/auth/components/sso-required-notice';
import { authErrorMessage, isEmailFieldError } from '@/feature/auth/helpers/auth-error';
import { emailDomainOf } from '@/feature/auth/helpers/email';
import { useSsoRequirement } from '@/feature/auth/helpers/use-sso-requirement';
import { useSsoSignIn } from '@/feature/auth/helpers/use-sso-sign-in';
import { SsoProviderMark } from '@/feature/brand/components/sso-provider-mark';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { PasswordInput } from '@/feature/common/components/password-input';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { errorHaptic } from '@/feature/common/helpers/haptics';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function SignInForm() {
  const { client } = useAuth();
  const t = useTranslations(authCatalog);
  const sso = useSsoRequirement();
  const ssoSignIn = useSsoSignIn();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const trimmedEmail = email.trim();
  const canSubmit = trimmedEmail.length > 0 && password.length > 0 && !submitting;

  const changeEmail = (value: string) => {
    setEmail(value);
    setError(null);
    setEmailError(null);
    ssoSignIn.clearError();
    sso.clear();
  };

  const submit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setEmailError(null);

    if (await sso.check(trimmedEmail)) {
      setSubmitting(false);
      return;
    }

    const result = await client.signIn.email({ email: trimmedEmail, password });
    setSubmitting(false);

    if (result.error) {
      errorHaptic();
      const message = authErrorMessage(result.error, t('signInFailed'));
      if (isEmailFieldError(result.error)) setEmailError(message);
      else setError(message);
    }
  };

  return (
    <View style={styles.form}>
      <Field invalid={Boolean(emailError)}>
        <FieldLabel>{t('emailLabel')}</FieldLabel>
        <Input
          value={email}
          onChangeText={changeEmail}
          onEndEditing={() => void sso.check(trimmedEmail)}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <FieldError>{emailError}</FieldError>
      </Field>

      {sso.requirement ? (
        <>
          <SsoRequiredNotice domain={emailDomainOf(trimmedEmail)} providerName={sso.requirement.providerName} />
          <Field invalid={Boolean(ssoSignIn.error)}>
            <Button
              size="lg"
              disabled={ssoSignIn.pending}
              onPress={() =>
                ssoSignIn.start(trimmedEmail, sso.requirement?.providerId ?? null, sso.requirement?.providerName)
              }
            >
              {ssoSignIn.pending ? (
                <ButtonSpinner />
              ) : (
                <>
                  <SsoProviderMark providerType={sso.requirement.providerType} tone="onPrimary" />
                  <ButtonText>
                    {t('continueWithProvider', { provider: sso.requirement.providerName || 'SSO' })}
                  </ButtonText>
                </>
              )}
            </Button>
            <FieldError>{ssoSignIn.error}</FieldError>
          </Field>
        </>
      ) : (
        <>
          <Field invalid={Boolean(error)}>
            <View style={styles.labelRow}>
              <FieldLabel>{t('passwordLabel')}</FieldLabel>
              <Link href={{ pathname: '/forgot-password', params: { email: trimmedEmail } }} asChild>
                <Pressable accessibilityRole="link" hitSlop={HIT_SLOP}>
                  <Text variant="captionStrong" tone="primary">
                    {t('forgotPassword')}
                  </Text>
                </Pressable>
              </Link>
            </View>
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder={t('passwordPlaceholder')}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <Button size="lg" disabled={!canSubmit} onPress={submit}>
            {submitting ? <ButtonSpinner /> : <ButtonText>{t('signInTitle')}</ButtonText>}
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
});
