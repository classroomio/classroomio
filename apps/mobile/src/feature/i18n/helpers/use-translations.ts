import { useMemo } from 'react';

import { createTranslator } from '@/feature/i18n/helpers/translate';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import type { Catalog, Messages } from '@/feature/i18n/types/i18n';

/** `t(key, values)` for a feature's catalog in the current app language. */
export function useTranslations<Source extends Messages>(catalog: Catalog<Source>) {
  const locale = useLocale();

  return useMemo(() => createTranslator(catalog, locale), [catalog, locale]);
}
