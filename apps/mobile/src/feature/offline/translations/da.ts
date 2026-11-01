import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  offline: 'Offline',
  youAreOffline: 'Du er offline',
  syncsOnReconnect: 'Fremskridt synkroniseres, når du er online igen',
  changesWaiting: {
    one: '{count} ændring venter på synkronisering',
    other: '{count} ændringer venter på synkronisering'
  },
  changesWaitingSentence: {
    one: '{count} ændring venter på synkronisering.',
    other: '{count} ændringer venter på synkronisering.'
  },
  changesWillSync: {
    one: '{count} ændring synkroniseres, når du er online igen.',
    other: '{count} ændringer synkroniseres, når du er online igen.'
  },
  allSynced: 'Alt, der er registreret på denne enhed, er synkroniseret.',
  synced: 'Synkroniseret',
  syncing: 'Synkroniserer',
  waitingToSync: 'Venter på synkronisering',
  retryingAttempt: 'Prøver automatisk igen · forsøg {attempt}',
  notAccepted: 'Ikke accepteret',
  notAcceptedReason: 'Ikke accepteret: {reason}',
  lessonCompleted: 'Lektion gennemført',
  videoProgressAt: 'Videofremskridt ved {position}',
  videoProgress: 'Videofremskridt',
  updateCount: { one: '{count} opdatering', other: '{count} opdateringer' },
  retry: 'Prøv igen',
  syncTitle: 'Synkronisering',
  syncNow: 'Synkroniser nu',
  signInToSave: 'Log ind igen for at gemme dine fremskridt.'
};
