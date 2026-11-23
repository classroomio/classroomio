import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  pathLabel: 'Læringsforløb',
  courseCount: { one: '{count} kursus', other: '{count} kurser' },
  coursesComplete: '{completed} af {total} kurser gennemført',
  pathCompleted: 'Forløb gennemført',
  percentComplete: '{percent} gennemført',
  stateCompleted: 'Gennemført',
  stateInProgress: 'I gang',
  stateNotStarted: 'Ikke startet',
  stateLocked: 'Låst',
  finishToUnlock: 'Gennemfør {course} for at låse op',
  inOrder: 'Kurserne låses op i rækkefølge.',
  anyOrder: 'Tag kurserne i vilkårlig rækkefølge.',
  courses: 'Kurser',
  join: 'Tilmeld dig forløbet',
  joined: 'Du er tilmeldt {name}',
  joinFailed: 'Du blev ikke tilføjet til forløbet',
  start: 'Start',
  nextUp: 'Næste: {title}',
  notJoinableInApp: 'Dette forløb kan ikke tilmeldes i appen.',
  loadError: 'Læringsforløbet blev ikke indlæst',
  emptyTitle: 'Ingen læringsforløb endnu',
  emptyDescription: 'Læringsforløb, du tilmelder dig, vises her med dine fremskridt i hvert kursus.',
  suggested: 'Foreslåede forløb'
};
