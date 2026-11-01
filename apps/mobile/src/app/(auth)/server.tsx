import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useServer } from '@/feature/server/components/server-provider';
import { normalizeServerUrl, verifyServerUrl } from '@/feature/server/helpers/server-url';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { serverCatalog } from '@/feature/server/translations/catalog';

export default function ServerScreen() {
  const { colors } = useTheme();
  const { serverUrl, isCustom, setServerUrl } = useServer();
  const t = useTranslations(serverCatalog);
  const [address, setAddress] = useState(isCustom ? serverUrl : '');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const connect = async () => {
    const url = normalizeServerUrl(address);
    setChecking(true);
    setError(null);

    try {
      await verifyServerUrl(url);
      await setServerUrl(url);
      showToast({ tone: 'success', title: t('updated'), description: new URL(url).host });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('unusable'));
    } finally {
      setChecking(false);
    }
  };

  const useCloud = async () => {
    await setServerUrl(null);
    router.back();
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={SPACING.xl}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t('title')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('description')}
        </Text>
      </View>

      <Field invalid={Boolean(error)}>
        <FieldLabel>{t('addressLabel')}</FieldLabel>
        <Input
          value={address}
          onChangeText={setAddress}
          placeholder={t('addressPlaceholder')}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={connect}
          autoFocus
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>{t('currently', { host: new URL(serverUrl).host })}</FieldDescription>
        )}
      </Field>

      <View style={styles.actions}>
        <Button size="lg" disabled={!address.trim() || checking} onPress={connect}>
          {checking ? <ButtonSpinner /> : <ButtonText>{t('connect')}</ButtonText>}
        </Button>
        {isCustom && (
          <Button variant="ghost" onPress={useCloud}>
            <ButtonText>{t('useCloud')}</ButtonText>
          </Button>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  heading: { gap: SPACING.xxs },
  actions: { gap: SPACING.xs }
});
