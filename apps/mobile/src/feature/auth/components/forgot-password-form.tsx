import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { requestPasswordReset } from '@/feature/auth/api/password-reset';
import { useAuth } from '@/feature/auth/components/auth-provider';
import { isEmail } from '@/feature/auth/helpers/email';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Icon } from '@/feature/common/components/icon';
import { Input } from '@/feature/common/components/input';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type ForgotPasswordFormProps = { initialEmail?: string; onDone: () => void };

export function ForgotPasswordForm({ initialEmail = '', onDone }: ForgotPasswordFormProps) {
  const { client } = useAuth();
  const t = useTranslations(authCatalog);
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const trimmedEmail = email.trim();

  const send = async () => {
    if (sending) return;

    if (!isEmail(trimmedEmail)) {
      setError(t('resetEmailInvalid'));
      return;
    }

    setSending(true);
    setError(null);

    try {
      await requestPasswordReset(client, trimmedEmail);
      successHaptic();
      setSentTo(trimmedEmail);
    } catch (cause) {
      errorHaptic();
      setError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  };

  if (sentTo) return <ResetEmailSent email={sentTo} onDone={onDone} onRetry={() => setSentTo(null)} />;

  return (
    <View style={styles.form}>
      <Field invalid={Boolean(error)}>
        <FieldLabel>{t('emailLabel')}</FieldLabel>
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
          returnKeyType="send"
          onSubmitEditing={send}
          autoFocus={!initialEmail}
        />
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{t('resetDescription')}</FieldDescription>}
      </Field>
      <Button size="lg" disabled={!trimmedEmail || sending} onPress={send}>
        {sending ? <ButtonSpinner /> : <ButtonText>{t('sendResetLink')}</ButtonText>}
      </Button>
    </View>
  );
}

type ResetEmailSentProps = { email: string; onDone: () => void; onRetry: () => void };

function ResetEmailSent({ email, onDone, onRetry }: ResetEmailSentProps) {
  const { colors } = useTheme();
  const t = useTranslations(authCatalog);

  return (
    <View style={styles.form}>
      <View style={styles.sent} accessibilityLiveRegion="polite">
        <View style={[styles.sentIcon, { backgroundColor: colors.successTint }]}>
          <Icon icon={EnvelopeSimpleIcon} size={20} tone="success" />
        </View>
        <View style={styles.sentCopy}>
          <Text variant="heading">{t('checkEmailTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('checkEmailDescription', { email })}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button size="lg" onPress={onDone}>
          <ButtonText>{t('backToSignIn')}</ButtonText>
        </Button>
        <Button variant="ghost" onPress={onRetry}>
          <ButtonText>{t('useDifferentEmail')}</ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg },
  sent: { flexDirection: 'row', gap: SPACING.sm },
  sentIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  sentCopy: { flex: 1, gap: SPACING.xxs },
  actions: { gap: SPACING.xs }
});
