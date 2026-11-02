import { router } from 'expo-router';

/** Returns to the previous screen, or Home when check-in was opened straight from a link. */
export function leaveCheckIn() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/');
}
