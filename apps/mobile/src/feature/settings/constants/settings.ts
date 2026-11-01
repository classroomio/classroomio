import type { ThemePreference } from '@/feature/settings/types/settings';

export const THEME_PREFERENCE_STORAGE_KEY = 'classroomio.theme_preference';

export const THEME_OPTIONS: { value: ThemePreference; labelKey: 'themeSystem' | 'themeLight' | 'themeDark' }[] = [
  { value: 'system', labelKey: 'themeSystem' },
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' }
];
