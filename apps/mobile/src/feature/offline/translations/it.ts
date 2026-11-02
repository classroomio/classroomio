import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  offline: 'Offline',
  youAreOffline: 'Sei offline',
  syncsOnReconnect: 'I progressi si sincronizzano quando torni online',
  changesWaiting: {
    one: '{count} modifica in attesa di sincronizzazione',
    other: '{count} modifiche in attesa di sincronizzazione'
  },
  changesWaitingSentence: {
    one: '{count} modifica in attesa di sincronizzazione.',
    other: '{count} modifiche in attesa di sincronizzazione.'
  },
  changesWillSync: {
    one: '{count} modifica verrà sincronizzata quando torni online.',
    other: '{count} modifiche verranno sincronizzate quando torni online.'
  },
  allSynced: 'Tutto ciò che è stato registrato su questo dispositivo è sincronizzato.',
  synced: 'Sincronizzato',
  syncing: 'Sincronizzazione in corso',
  waitingToSync: 'In attesa di sincronizzazione',
  retryingAttempt: 'Nuovo tentativo automatico · tentativo {attempt}',
  notAccepted: 'Non accettato',
  notAcceptedReason: 'Non accettato: {reason}',
  lessonCompleted: 'Lezione completata',
  videoProgressAt: 'Avanzamento video a {position}',
  videoProgress: 'Avanzamento video',
  updateCount: { one: '{count} aggiornamento', other: '{count} aggiornamenti' },
  retry: 'Riprova',
  syncTitle: 'Sincronizzazione',
  syncNow: 'Sincronizza ora',
  signInToSave: 'Accedi di nuovo per salvare i tuoi progressi.'
};
