import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  offline: 'Offline',
  youAreOffline: 'Jesteś offline',
  syncsOnReconnect: 'Postępy zsynchronizują się po ponownym połączeniu',
  changesWaiting: {
    one: '{count} zmiana czeka na synchronizację',
    few: '{count} zmiany czekają na synchronizację',
    many: '{count} zmian czeka na synchronizację',
    other: '{count} zmiany czeka na synchronizację'
  },
  changesWaitingSentence: {
    one: '{count} zmiana czeka na synchronizację.',
    few: '{count} zmiany czekają na synchronizację.',
    many: '{count} zmian czeka na synchronizację.',
    other: '{count} zmiany czeka na synchronizację.'
  },
  changesWillSync: {
    one: '{count} zmiana zsynchronizuje się po ponownym połączeniu.',
    few: '{count} zmiany zsynchronizują się po ponownym połączeniu.',
    many: '{count} zmian zsynchronizuje się po ponownym połączeniu.',
    other: '{count} zmiany zsynchronizuje się po ponownym połączeniu.'
  },
  allSynced: 'Wszystko, co zapisano na tym urządzeniu, jest zsynchronizowane.',
  synced: 'Zsynchronizowano',
  syncing: 'Synchronizowanie',
  waitingToSync: 'Czeka na synchronizację',
  retryingAttempt: 'Automatyczne ponawianie · próba {attempt}',
  notAccepted: 'Nie zaakceptowano',
  notAcceptedReason: 'Nie zaakceptowano: {reason}',
  lessonCompleted: 'Lekcja ukończona',
  videoProgressAt: 'Postęp wideo: {position}',
  videoProgress: 'Postęp wideo',
  updateCount: {
    one: '{count} aktualizacja',
    few: '{count} aktualizacje',
    many: '{count} aktualizacji',
    other: '{count} aktualizacji'
  },
  retry: 'Ponów',
  syncTitle: 'Synchronizacja',
  syncNow: 'Synchronizuj teraz',
  signInToSave: 'Zaloguj się ponownie, aby zapisać postępy.'
};
