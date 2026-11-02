import Storage from 'expo-sqlite/kv-store';

import { PUSH_PROMPT_MIN_SESSIONS, PUSH_PROMPT_SNOOZE_MS } from '@/feature/notifications/constants/notifications';

const SESSIONS_KEY = 'push-prompt:sessions';
const SNOOZED_AT_KEY = 'push-prompt:snoozed-at';

function readNumber(key: string) {
  try {
    return Number(Storage.getItemSync(key) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Counts a signed-in app session; the pre-prompt waits until the person has come back at least once. */
export function recordAppSession() {
  void Storage.setItemAsync(SESSIONS_KEY, String(readNumber(SESSIONS_KEY) + 1)).catch(() => {});
}

export function snoozePushPrompt() {
  void Storage.setItemAsync(SNOOZED_AT_KEY, String(Date.now())).catch(() => {});
}

export function shouldOfferPushPrompt(now = Date.now()) {
  const snoozedAt = readNumber(SNOOZED_AT_KEY);

  return readNumber(SESSIONS_KEY) >= PUSH_PROMPT_MIN_SESSIONS && now - snoozedAt > PUSH_PROMPT_SNOOZE_MS;
}
