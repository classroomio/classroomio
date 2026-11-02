import { ApiError } from '@/feature/common/api/request';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

/** A user-facing message for a failed request or action, in `locale` (the app language by default). */
export function errorMessage(error: unknown, locale: Locale = getCurrentLocale()) {
  const t = createTranslator(commonCatalog, locale);

  if (error instanceof ApiError) return error.status >= 500 ? t('somethingWentWrong') : error.message;
  if (error instanceof TypeError) return t('offlineError');
  if (error instanceof Error && error.message) return error.message;

  return t('somethingWentWrong');
}
