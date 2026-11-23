import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { inviteHref, parseInviteLink } from '@/feature/account/helpers/pending-invite-store';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function JoinWithInviteScreen() {
  const { colors } = useTheme();
  const t = useTranslations(authCatalog);
  const common = useTranslations(commonCatalog);
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const changeLink = (value: string) => {
    setLink(value);
    setError(null);
  };

  const open = () => {
    const invite = parseInviteLink(link);
    if (!invite) {
      setError(t('inviteLinkInvalid'));
      return;
    }

    router.back();
    router.push(inviteHref(invite));
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
          {t('joinTitle')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('joinDescription')}
        </Text>
      </View>

      <Field invalid={Boolean(error)}>
        <FieldLabel>{t('inviteLinkLabel')}</FieldLabel>
        <Input
          value={link}
          onChangeText={changeLink}
          placeholder={t('inviteLinkPlaceholder')}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={open}
          autoFocus
        />
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{t('inviteLinkHint')}</FieldDescription>}
      </Field>

      <Button size="lg" disabled={!link.trim()} onPress={open}>
        <ButtonText>{common('continue')}</ButtonText>
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  heading: { gap: SPACING.xxs }
});
