import { errorMessage } from '@/feature/common/helpers/error-message';
import { DownloadsNotReadyError } from '@/feature/downloads/helpers/download-manager';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** `errorMessage` that also words the download manager's own errors in the app language. */
export function useDownloadErrorMessage() {
  const t = useTranslations(downloadsCatalog);

  return (error: unknown) => (error instanceof DownloadsNotReadyError ? t('notReady') : errorMessage(error));
}
