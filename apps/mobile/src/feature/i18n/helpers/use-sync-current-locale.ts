import { useEffect } from 'react';

import { setCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { useLocale } from '@/feature/i18n/helpers/use-locale';

/** Mirrors the app language into `getCurrentLocale()`; mount once near the root, inside the API provider. */
export function useSyncCurrentLocale() {
  const locale = useLocale();

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);
}
