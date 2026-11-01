import { offlineMediaKey } from '@cio/utils/functions/offline-media';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';

import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonDocument } from '@/feature/lesson/types/lesson';
import { showToast } from '@/feature/toast/helpers/toast-store';

function safeName(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document';
}

async function download(document: LessonDocument, localFiles?: ReadonlyMap<string, File>) {
  const local = localFiles?.get(offlineMediaKey(document));
  if (local?.exists) return local;

  const directory = new Directory(Paths.cache, 'lesson-documents');
  directory.create({ intermediates: true, idempotent: true });

  return File.downloadFileAsync(document.link, new File(directory, safeName(document.name)), { idempotent: true });
}

/**
 * Opens a lesson document in the platform viewer (Quick Look on iOS, a viewer app on Android),
 * falling back to the share sheet, then the browser, when the file cannot be previewed.
 * Documents in `localFiles` (keyed by `offlineMediaKey`) open from the device without a download.
 */
export function useOpenDocument(localFiles?: ReadonlyMap<string, File>) {
  const t = useTranslations(lessonCatalog);
  const { openExternal } = useOpenLink();
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const open = async (document: LessonDocument) => {
    if (openingKey) return;

    setOpeningKey(document.key || document.link);
    try {
      const file = await download(document, localFiles);
      if (await File.canPreview(file).catch(() => false)) {
        await File.preview(file, { title: document.name });
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: document.name });
        return;
      }

      await openExternal(document.link);
    } catch (error) {
      showToast({ tone: 'danger', title: t('documentOpenError'), description: errorMessage(error) });
    } finally {
      setOpeningKey(null);
    }
  };

  const share = async (document: LessonDocument) => {
    try {
      const file = await download(document, localFiles);
      await Sharing.shareAsync(file.uri, { dialogTitle: document.name });
    } catch (error) {
      showToast({ tone: 'danger', title: t('documentShareError'), description: errorMessage(error) });
    }
  };

  return { open, share, openingKey };
}
