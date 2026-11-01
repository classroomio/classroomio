import { TranslateIcon } from 'phosphor-react-native/src/icons/Translate';
import { router } from 'expo-router';

import { IconTile } from '@/feature/common/components/icon-tile';
import { Item, ItemActions, ItemChevron, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { LOCALE_NAMES } from '@/feature/i18n/constants/locales';
import { useLocalePreference } from '@/feature/i18n/helpers/locale-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function LanguageSetting() {
  const t = useTranslations(settingsCatalog);
  const { colors } = useTheme();
  const preference = useLocalePreference();

  return (
    <Item onPress={() => router.push('/profile/language')}>
      <ItemMedia>
        <IconTile icon={TranslateIcon} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{t('language')}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <SettingValue>{preference === 'system' ? t('languageSystem') : LOCALE_NAMES[preference]}</SettingValue>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
