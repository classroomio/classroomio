import { FilmStripIcon } from 'phosphor-react-native/src/icons/FilmStrip';
import { router } from 'expo-router';

import { IconTile } from '@/feature/common/components/icon-tile';
import { Item, ItemActions, ItemChevron, ItemContent, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { VIDEO_QUALITY_OPTIONS } from '@/feature/settings/constants/settings';
import { useVideoQuality } from '@/feature/settings/helpers/video-quality-store';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function VideoQualitySetting() {
  const t = useTranslations(settingsCatalog);
  const { colors } = useTheme();
  const quality = useVideoQuality();
  const option = VIDEO_QUALITY_OPTIONS.find((item) => item.value === quality);

  return (
    <Item onPress={() => router.push('/profile/video-quality')}>
      <ItemMedia>
        <IconTile icon={FilmStripIcon} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{t('videoQuality')}</ItemTitle>
      </ItemContent>
      <ItemActions>
        {option ? <SettingValue>{t(option.labelKey)}</SettingValue> : null}
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}
