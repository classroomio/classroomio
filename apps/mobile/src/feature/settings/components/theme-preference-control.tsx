import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { THEME_OPTIONS } from '@/feature/settings/constants/settings';
import { setThemePreference, useThemePreference } from '@/feature/settings/helpers/theme-preference-store';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export function ThemePreferenceControl() {
  const t = useTranslations(settingsCatalog);
  const preference = useThemePreference();

  return (
    <SegmentedControl value={preference} onValueChange={setThemePreference}>
      {THEME_OPTIONS.map((option) => (
        <SegmentedControlItem key={option.value} value={option.value}>
          {t(option.labelKey)}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
