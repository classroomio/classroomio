import { CheckIcon } from 'phosphor-react-native/src/icons/Check';

import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenSection } from '@/feature/common/components/screen';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SettingsFootnote } from '@/feature/settings/components/settings-footnote';
import { VIDEO_QUALITY_OPTIONS } from '@/feature/settings/constants/settings';
import { setVideoQuality, useVideoQuality } from '@/feature/settings/helpers/video-quality-store';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function VideoQualityList() {
  const t = useTranslations(settingsCatalog);
  const quality = useVideoQuality();

  return (
    <ScreenSection>
      <ItemGroup>
        {VIDEO_QUALITY_OPTIONS.map((option) => {
          const selected = option.value === quality;

          return (
            <Item
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                if (selected) return;

                selectionHaptic();
                setVideoQuality(option.value);
              }}
            >
              <ItemContent>
                <ItemTitle>{t(option.labelKey)}</ItemTitle>
                <ItemDescription>{t(option.descriptionKey)}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {selected ? <Icon icon={CheckIcon} size={18} tone="primary" weight="bold" /> : null}
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>
      <SettingsFootnote>{t('videoQualityFooter')}</SettingsFootnote>
    </ScreenSection>
  );
}
