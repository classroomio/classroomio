import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  offline: 'Hors ligne',
  youAreOffline: 'Vous êtes hors ligne',
  syncsOnReconnect: 'La progression se synchronise à la reconnexion',
  changesWaiting: {
    one: '{count} modification en attente de synchronisation',
    other: '{count} modifications en attente de synchronisation'
  },
  changesWaitingSentence: {
    one: '{count} modification en attente de synchronisation.',
    other: '{count} modifications en attente de synchronisation.'
  },
  changesWillSync: {
    one: '{count} modification sera synchronisée à la reconnexion.',
    other: '{count} modifications seront synchronisées à la reconnexion.'
  },
  allSynced: 'Tout ce qui a été enregistré sur cet appareil est synchronisé.',
  synced: 'Synchronisé',
  syncing: 'Synchronisation',
  waitingToSync: 'En attente de synchronisation',
  retryingAttempt: 'Nouvelle tentative automatique · essai {attempt}',
  notAccepted: 'Non accepté',
  notAcceptedReason: 'Non accepté : {reason}',
  lessonCompleted: 'Leçon terminée',
  videoProgressAt: 'Progression vidéo à {position}',
  videoProgress: 'Progression vidéo',
  updateCount: { one: '{count} mise à jour', other: '{count} mises à jour' },
  retry: 'Réessayer',
  syncTitle: 'Synchronisation',
  syncNow: 'Synchroniser',
  signInToSave: 'Reconnectez-vous pour enregistrer votre progression.'
};
