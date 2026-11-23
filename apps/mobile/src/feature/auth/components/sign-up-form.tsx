import { PASSWORD_MIN_LENGTH } from '@cio/utils/constants/password';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { SsoRequiredNotice } from '@/feature/auth/components/sso-required-notice';
import { authErrorMessage, isEmailFieldError, isPasswordFieldError } from '@/feature/auth/helpers/auth-error';
import { emailDomainOf } from '@/feature/auth/helpers/email';
import { useSsoRequirement } from '@/feature/auth/helpers/use-sso-requirement';
import { useSsoSignIn } from '@/feature/auth/helpers/use-sso-sign-in';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { SsoProviderMark } from '@/feature/brand/components/sso-provider-mark';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { PasswordInput } from '@/feature/common/components/password-input';
import { SPACING } from '@/feature/common/constants/layout';
import { errorHaptic } from '@/feature/common/helpers/haptics';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** Creates an email and password account and signs the person in. Accounts on a single sign-on domain go to SSO. */
export function SignUpForm() {
  const { client } = useAuth();
  const t = useTranslations(authCatalog);
  const sso = useSsoRequirement();
  const ssoSignIn = useSsoSignIn();
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const canSubmit = trimmedName.length > 0 && trimmedEmail.length > 0 && password.length > 0 && !submitting;

  const changeEmail = (value: string) => {
    setEmail(value);
    setError(null);
    setEmailError(null);
    ssoSignIn.clearError();
    sso.clear();
  };

  const changePassword = (value: string) => {
    setPassword(value);
    setPasswordError(null);
  };

  const submit = async () => {
    if (!canSubmit) return;

    if (password.length < PASSWORD_MIN_LENGTH) {
      errorHaptic();
      setPasswordError(t('passwordTooShort', { count: PASSWORD_MIN_LENGTH }));
      return;
    }

    setSubmitting(true);
    setError(null);
    setEmailError(null);

    try {
      if (await sso.check(trimmedEmail)) return;

      const result = await client.signUp.email({ name: trimmedName, email: trimmedEmail, password });
      if (result.error) {
        errorHaptic();
        const message = authErrorMessage(result.error, t('signUpFailed'));
        if (isEmailFieldError(result.error)) setEmailError(message);
        else if (isPasswordFieldError(result.error)) setPasswordError(message);
        else setError(message);
      }
    } catch {
      errorHaptic();
      setError(t('signUpFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <Field>
        <FieldLabel>{t('nameLabel')}</FieldLabel>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t('namePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </Field>

      <Field invalid={Boolean(emailError)}>
        <FieldLabel>{t('emailLabel')}</FieldLabel>
        <Input
          ref={emailRef}
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
          <Field invalid={Boolean(passwordError || error)}>
            <FieldLabel>{t('passwordLabel')}</FieldLabel>
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChangeText={changePassword}
              placeholder={t('newPasswordPlaceholder')}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            {passwordError || error ? (
              <FieldError>{passwordError ?? error}</FieldError>
            ) : (
              <FieldDescription>{t('passwordHint', { count: PASSWORD_MIN_LENGTH })}</FieldDescription>
            )}
          </Field>
          <Button size="lg" disabled={!canSubmit} onPress={submit}>
            {submitting ? <ButtonSpinner /> : <ButtonText>{t('createAccount')}</ButtonText>}
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.md }
});
