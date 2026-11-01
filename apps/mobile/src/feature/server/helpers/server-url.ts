import * as SecureStore from 'expo-secure-store';

import { DEFAULT_SERVER_URL, SERVER_URL_STORAGE_KEY } from '@/feature/server/constants/server';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import { serverCatalog } from '@/feature/server/translations/catalog';

export function normalizeServerUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '');

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function readServerUrl() {
  return SecureStore.getItem(SERVER_URL_STORAGE_KEY) ?? DEFAULT_SERVER_URL;
}

export async function saveServerUrl(url: string | null) {
  if (url === null || url === DEFAULT_SERVER_URL) {
    await SecureStore.deleteItemAsync(SERVER_URL_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(SERVER_URL_STORAGE_KEY, url);
}

/** Resolves when `url` answers like a ClassroomIO API; throws a user-facing message otherwise. */
export async function verifyServerUrl(url: string) {
  const t = createTranslator(serverCatalog, getCurrentLocale());
  let response: Response;

  try {
    response = await fetch(`${url}/api/auth/ok`, { headers: { accept: 'application/json' } });
  } catch {
    throw new Error(t('unreachable'));
  }

  const body: unknown = await response.json().catch(() => null);
  const isClassroomio = response.ok && typeof body === 'object' && body !== null && 'ok' in body;

  if (!isClassroomio) throw new Error(t('notClassroomio'));
}
