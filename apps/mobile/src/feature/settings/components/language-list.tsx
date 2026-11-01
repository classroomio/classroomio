import { Check } from 'lucide-react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/feature/common/components/item';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useLocalePreference } from '@/feature/i18n/helpers/locale-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { LocalePreference } from '@/feature/i18n/types/i18n';
import { LANGUAGE_OPTIONS } from '@/feature/settings/helpers/language-options';
import { useChangeLanguage } from '@/feature/settings/helpers/use-change-language';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function LanguageList() {
  const t = useTranslations(settingsCatalog);
  const preference = useLocalePreference();
  const changeLanguage = useChangeLanguage();

  const select = (next: LocalePreference) => {
    if (next === preference) return;

    selectionHaptic();
    changeLanguage(next);
  };

  return (
    <ItemGroup>
      <Item onPress={() => select('system')} accessibilityState={{ selected: preference === 'system' }}>
        <ItemContent>
          <ItemTitle>{t('languageSystem')}</ItemTitle>
          <ItemDescription>{t('languageSystemDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>{preference === 'system' ? <Icon icon={Check} size={18} tone="primary" /> : null}</ItemActions>
      </Item>
      {LANGUAGE_OPTIONS.map((option) => (
        <Item
          key={option.locale}
          onPress={() => select(option.locale)}
          accessibilityState={{ selected: preference === option.locale }}
        >
          <ItemContent>
            <ItemTitle>{option.name}</ItemTitle>
          </ItemContent>
          <ItemActions>
            {preference === option.locale ? <Icon icon={Check} size={18} tone="primary" /> : null}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
