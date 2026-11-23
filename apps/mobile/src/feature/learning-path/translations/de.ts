import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  pathLabel: 'Lernpfad',
  courseCount: { one: '{count} Kurs', other: '{count} Kurse' },
  coursesComplete: '{completed} von {total} Kursen abgeschlossen',
  pathCompleted: 'Lernpfad abgeschlossen',
  percentComplete: '{percent} abgeschlossen',
  stateCompleted: 'Abgeschlossen',
  stateInProgress: 'Begonnen',
  stateNotStarted: 'Nicht begonnen',
  stateLocked: 'Gesperrt',
  finishToUnlock: 'Schließen Sie {course} ab, um ihn freizuschalten',
  inOrder: 'Die Kurse werden nacheinander freigeschaltet.',
  anyOrder: 'Sie können die Kurse in beliebiger Reihenfolge belegen.',
  courses: 'Kurse',
  join: 'Lernpfad beitreten',
  joined: 'Sie sind {name} beigetreten',
  joinFailed: 'Sie wurden dem Lernpfad nicht hinzugefügt',
  start: 'Starten',
  nextUp: 'Als Nächstes: {title}',
  notJoinableInApp: 'Diesem Lernpfad können Sie in der App nicht beitreten.',
  loadError: 'Der Lernpfad wurde nicht geladen',
  emptyTitle: 'Noch keine Lernpfade',
  emptyDescription: 'Lernpfade, denen Sie beitreten, werden hier mit Ihrem Fortschritt in jedem Kurs aufgeführt.',
  suggested: 'Vorgeschlagene Lernpfade'
};
