import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  pathLabel: 'Percorso di apprendimento',
  courseCount: { one: '{count} corso', other: '{count} corsi' },
  coursesComplete: '{completed} di {total} corsi completati',
  pathCompleted: 'Percorso completato',
  percentComplete: '{percent} completato',
  stateCompleted: 'Completato',
  stateInProgress: 'In corso',
  stateNotStarted: 'Non iniziato',
  stateLocked: 'Bloccato',
  finishToUnlock: 'Completa {course} per sbloccarlo',
  inOrder: 'I corsi si sbloccano in ordine.',
  anyOrder: 'Segui i corsi in qualsiasi ordine.',
  courses: 'Corsi',
  join: 'Unisciti al percorso',
  joined: 'Ti sei unito a {name}',
  joinFailed: 'Non sei stato aggiunto a questo percorso',
  start: 'Inizia',
  nextUp: 'Prossimo: {title}',
  notJoinableInApp: 'Non puoi unirti a questo percorso dall’app.',
  loadError: 'Il percorso non è stato caricato',
  emptyTitle: 'Ancora nessun percorso',
  emptyDescription: 'I percorsi a cui ti unisci sono elencati qui con i progressi in ogni corso.',
  suggested: 'Percorsi suggeriti'
};
