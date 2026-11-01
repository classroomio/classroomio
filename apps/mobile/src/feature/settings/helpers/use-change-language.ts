import { useUpdateProfileMutation } from '@/feature/account/api/update-profile';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { deviceLocale, setLocalePreference } from '@/feature/i18n/helpers/locale-store';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { LocalePreference } from '@/feature/i18n/types/i18n';
import { settingsCatalog } from '@/feature/settings/translations/catalog';
import { showToast } from '@/feature/toast/helpers/toast-store';

/** Applies a language choice on this device and saves the resulting language to the user's profile. */
export function useChangeLanguage() {
  const t = useTranslations(settingsCatalog);
  const updateProfile = useUpdateProfileMutation();

  return (preference: LocalePreference) => {
    setLocalePreference(preference);
    const locale = preference === 'system' ? deviceLocale() : preference;

    updateProfile.mutate(
      { locale },
      {
        onError: (error) =>
          showToast({ tone: 'warning', title: t('languageNotSaved'), description: errorMessage(error, locale) })
      }
    );
  };
}
