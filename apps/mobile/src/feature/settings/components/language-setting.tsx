import { TranslateIcon } from 'phosphor-react-native/src/icons/Translate';
import { router } from 'expo-router';

import { Icon } from '@/feature/common/components/icon';
import { Item, ItemActions, ItemChevron, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { LOCALE_NAMES } from '@/feature/i18n/constants/locales';
import { useLocalePreference } from '@/feature/i18n/helpers/locale-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function LanguageSetting() {
  const t = useTranslations(settingsCatalog);
  const preference = useLocalePreference();

  return (
    <Item onPress={() => router.push('/profile/language')}>
      <ItemMedia variant="tile">
        <Icon icon={TranslateIcon} size={20} tone="ink" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{t('language')}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <SettingValue>{preference === 'system' ? t('languageSystem') : LOCALE_NAMES[preference]}</SettingValue>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
