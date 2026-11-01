import type { VideoSize } from 'expo-video';

import type { en } from '@/feature/settings/translations/en';
import type { ThemePreference, VideoQuality } from '@/feature/settings/types/settings';

export const THEME_PREFERENCE_STORAGE_KEY = 'classroomio.theme_preference';

export const VIDEO_QUALITY_STORAGE_KEY = 'classroomio.video_quality';

export const THEME_OPTIONS: { value: ThemePreference; labelKey: 'themeSystem' | 'themeLight' | 'themeDark' }[] = [
  { value: 'system', labelKey: 'themeSystem' },
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' }
];

type VideoQualityOption = {
  value: VideoQuality;
  labelKey: keyof typeof en;
  descriptionKey: keyof typeof en;
  /** The largest rendition the player may pick from an adaptive stream; null leaves the choice to the player. */
  maxResolution: VideoSize | null;
};

export const VIDEO_QUALITY_OPTIONS: VideoQualityOption[] = [
  { value: 'auto', labelKey: 'videoQualityAuto', descriptionKey: 'videoQualityAutoDescription', maxResolution: null },
  {
    value: 'standard',
    labelKey: 'videoQualityStandard',
    descriptionKey: 'videoQualityStandardDescription',
    maxResolution: { width: 1280, height: 720 }
  },
  {
    value: 'data-saver',
    labelKey: 'videoQualityDataSaver',
    descriptionKey: 'videoQualityDataSaverDescription',
    maxResolution: { width: 854, height: 480 }
  }
];
