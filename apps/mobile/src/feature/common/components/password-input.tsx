import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, type TextInput, type TextInputProps } from 'react-native';

import { HIT_SLOP } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & { ref?: Ref<ComponentRef<typeof TextInput>> };

export function PasswordInput(props: PasswordInputProps) {
  const t = useTranslations(commonCatalog);
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="current-password"
        {...props}
        secureTextEntry={!visible}
      />
      <InputGroupAddon>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('hidePassword') : t('showPassword')}
          hitSlop={HIT_SLOP}
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}
        >
          <Icon icon={visible ? EyeSlashIcon : EyeIcon} size={19} tone="muted" />
        </Pressable>
      </InputGroupAddon>
    </InputGroup>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }
});
