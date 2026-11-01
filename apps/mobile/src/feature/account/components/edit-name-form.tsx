import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useUpdateProfileMutation } from '@/feature/account/api/update-profile';
import { FULL_NAME_MIN_LENGTH } from '@/feature/account/constants/account';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { SPACING } from '@/feature/common/constants/layout';
import { errorHaptic, successHaptic } from '@/feature/common/helpers/haptics';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type EditNameFormProps = { initialName: string; onSaved: () => void };

export function EditNameForm({ initialName, onSaved }: EditNameFormProps) {
  const updateProfile = useUpdateProfileMutation();
  const t = useTranslations(accountCatalog);
  const tc = useTranslations(commonCatalog);
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const tooShort = trimmed.length < FULL_NAME_MIN_LENGTH;
  const canSave = !tooShort && trimmed !== initialName.trim() && !updateProfile.isPending;

  const save = () => {
    if (!canSave) return;

    updateProfile.mutate(
      { fullname: trimmed },
      {
        onSuccess: () => {
          successHaptic();
          showToast({ tone: 'success', title: t('nameUpdated') });
          onSaved();
        },
        onError: () => errorHaptic()
      }
    );
  };

  return (
    <View style={styles.form}>
      <Field invalid={updateProfile.isError}>
        <FieldLabel>{t('fullNameLabel')}</FieldLabel>
        <Input
          value={name}
          onChangeText={(value) => {
            setName(value);
            updateProfile.reset();
          }}
          placeholder={t('fullNamePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={save}
          autoFocus
        />
        {updateProfile.isError ? (
          <FieldError>{errorMessage(updateProfile.error)}</FieldError>
        ) : (
          <FieldDescription>
            {tooShort && trimmed.length > 0 ? t('nameTooShort', { count: FULL_NAME_MIN_LENGTH }) : t('nameDescription')}
          </FieldDescription>
        )}
      </Field>
      <Button size="lg" disabled={!canSave} onPress={save}>
        {updateProfile.isPending ? <ButtonSpinner /> : <ButtonText>{tc('save')}</ButtonText>}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg }
});
