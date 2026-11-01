import { ALLOWED_IMAGE_TYPES } from '@cio/utils/validation/constants';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { uploadImage } from '@/feature/common/api/upload-image';
import { useApi } from '@/feature/common/components/api-provider';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export type ImageAttachment = { key: string; uri: string; url: string | null; uploading: boolean };

const MAX_ATTACHMENTS = 4;

let nextKey = 1;

function attachmentFromUrl(url: string): ImageAttachment {
  return { key: `remote-${nextKey++}`, uri: url, url, uploading: false };
}

export function useImageAttachments(initialUrls: string[] = []) {
  const api = useApi();
  const t = useTranslations(commonCatalog);
  const [items, setItems] = useState<ImageAttachment[]>(() => initialUrls.map(attachmentFromUrl));

  const update = (key: string, patch: Partial<ImageAttachment>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const remove = (key: string) => setItems((current) => current.filter((item) => item.key !== key));

  const pick = async () => {
    const remaining = MAX_ATTACHMENTS - items.length;
    if (remaining <= 0) {
      showToast({ title: t('attachmentLimit', { count: MAX_ATTACHMENTS }), tone: 'warning' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8
    });
    if (result.canceled) return;

    const picked = result.assets.slice(0, remaining).map((asset) => {
      const mimeType =
        asset.mimeType && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(asset.mimeType)
          ? asset.mimeType
          : 'image/jpeg';
      const extension = mimeType.split('/')[1] ?? 'jpg';

      return {
        attachment: { key: `local-${nextKey++}`, uri: asset.uri, url: null, uploading: true },
        upload: { uri: asset.uri, name: asset.fileName ?? `image.${extension}`, mimeType }
      };
    });

    setItems((current) => [...current, ...picked.map(({ attachment }) => attachment)]);

    await Promise.all(
      picked.map(async ({ attachment, upload }) => {
        try {
          const url = await uploadImage(api, upload);
          update(attachment.key, { url, uploading: false });
        } catch (error) {
          remove(attachment.key);
          showToast({ title: t('imageUploadFailed'), description: errorMessage(error), tone: 'danger' });
        }
      })
    );
  };

  return {
    items,
    pick,
    remove,
    reset: () => setItems([]),
    urls: items.flatMap((item) => (item.url ? [item.url] : [])),
    uploading: items.some((item) => item.uploading)
  };
}
