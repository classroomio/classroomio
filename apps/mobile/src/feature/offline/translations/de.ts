import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  offline: 'Offline',
  youAreOffline: 'Sie sind offline',
  syncsOnReconnect: 'Der Fortschritt wird synchronisiert, sobald Sie wieder online sind',
  changesWaiting: {
    one: '{count} Änderung wartet auf Synchronisierung',
    other: '{count} Änderungen warten auf Synchronisierung'
  },
  changesWaitingSentence: {
    one: '{count} Änderung wartet auf Synchronisierung.',
    other: '{count} Änderungen warten auf Synchronisierung.'
  },
  changesWillSync: {
    one: '{count} Änderung wird synchronisiert, sobald Sie wieder online sind.',
    other: '{count} Änderungen werden synchronisiert, sobald Sie wieder online sind.'
  },
  allSynced: 'Alles, was auf diesem Gerät erfasst wurde, ist synchronisiert.',
  synced: 'Synchronisiert',
  syncing: 'Wird synchronisiert',
  waitingToSync: 'Wartet auf Synchronisierung',
  retryingAttempt: 'Wird automatisch wiederholt · Versuch {attempt}',
  notAccepted: 'Nicht angenommen',
  notAcceptedReason: 'Nicht angenommen: {reason}',
  lessonCompleted: 'Lektion abgeschlossen',
  videoProgressAt: 'Videofortschritt bei {position}',
  videoProgress: 'Videofortschritt',
  updateCount: { one: '{count} Aktualisierung', other: '{count} Aktualisierungen' },
  retry: 'Wiederholen',
  syncTitle: 'Synchronisierung',
  syncNow: 'Jetzt synchronisieren',
  signInToSave: 'Melden Sie sich erneut an, um Ihren Fortschritt zu speichern.'
};
