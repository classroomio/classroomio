import { Stack } from 'expo-router';

import { ScreenScrollView } from '@/feature/common/components/screen';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { VideoQualityList } from '@/feature/settings/components/video-quality-list';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export default function VideoQualityScreen() {
  const t = useTranslations(settingsCatalog);

  return (
    <>
      <Stack.Screen options={{ title: t('videoQuality'), headerLargeTitleEnabled: false }} />
      <ScreenScrollView>
        <VideoQualityList />
      </ScreenScrollView>
    </>
  );
}
