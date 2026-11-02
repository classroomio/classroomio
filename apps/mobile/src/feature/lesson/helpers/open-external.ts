import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import { showToast } from '@/feature/toast/helpers/toast-store';

/** Opens web links in the in-app system browser and other schemes (mail, phone, meeting apps) in their own app. */
export async function openExternal(url: string, failureTitle: string) {
  try {
    if (/^https?:\/\//i.test(url)) {
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
      return;
    }

    await Linking.openURL(url);
  } catch {
    showToast({ tone: 'danger', title: failureTitle, description: url });
  }
}

/** Hands a link to the operating system, so meeting links open their own app (Zoom, Teams, Meet) when installed. */
export async function openInSystem(url: string, failureTitle: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showToast({ tone: 'danger', title: failureTitle, description: url });
  }
}

/** `openExternal` and `openInSystem` with their failure toast in the app language. */
export function useOpenLink() {
  const t = useTranslations(lessonCatalog);
  const failureTitle = t('linkOpenError');

  return {
    openExternal: (url: string) => openExternal(url, failureTitle),
    openInSystem: (url: string) => openInSystem(url, failureTitle)
  };
}
