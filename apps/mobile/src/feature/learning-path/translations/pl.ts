import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  pathLabel: 'Ścieżka nauki',
  courseCount: { one: '{count} kurs', few: '{count} kursy', many: '{count} kursów', other: '{count} kursu' },
  coursesComplete: 'Ukończono {completed} z {total} kursów',
  pathCompleted: 'Ścieżka ukończona',
  percentComplete: 'Ukończono {percent}',
  stateCompleted: 'Ukończono',
  stateInProgress: 'W trakcie',
  stateNotStarted: 'Nierozpoczęty',
  stateLocked: 'Zablokowany',
  finishToUnlock: 'Ukończ {course}, aby odblokować',
  inOrder: 'Kursy odblokowują się po kolei.',
  anyOrder: 'Kursy możesz przechodzić w dowolnej kolejności.',
  courses: 'Kursy',
  join: 'Dołącz do ścieżki',
  joined: 'Dołączono do: {name}',
  joinFailed: 'Nie dodano Cię do tej ścieżki',
  start: 'Rozpocznij',
  nextUp: 'Następny: {title}',
  notJoinableInApp: 'Do tej ścieżki nie można dołączyć w aplikacji.',
  loadError: 'Nie wczytano ścieżki nauki',
  emptyTitle: 'Brak ścieżek nauki',
  emptyDescription: 'Ścieżki, do których dołączysz, są tu wymienione wraz z postępem w każdym kursie.',
  suggested: 'Proponowane ścieżki'
};
