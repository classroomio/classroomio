import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  pathLabel: 'Öğrenme yolu',
  courseCount: { one: '{count} kurs', other: '{count} kurs' },
  coursesComplete: '{total} kurstan {completed} tanesi tamamlandı',
  pathCompleted: 'Yol tamamlandı',
  percentComplete: '{percent} tamamlandı',
  stateCompleted: 'Tamamlandı',
  stateInProgress: 'Devam ediyor',
  stateNotStarted: 'Başlanmadı',
  stateLocked: 'Kilitli',
  finishToUnlock: 'Kilidi açmak için {course} kursunu bitirin',
  inOrder: 'Kursların kilidi sırayla açılır.',
  anyOrder: 'Kursları istediğiniz sırayla alın.',
  courses: 'Kurslar',
  join: 'Yola katıl',
  joined: '{name} yoluna katıldınız',
  joinFailed: 'Bu yola eklenmediniz',
  start: 'Başla',
  nextUp: 'Sıradaki: {title}',
  notJoinableInApp: 'Bu yola uygulamadan katılamazsınız.',
  loadError: 'Öğrenme yolu yüklenmedi',
  emptyTitle: 'Henüz öğrenme yolu yok',
  emptyDescription: 'Katıldığınız öğrenme yolları, her kurstaki ilerlemenizle burada listelenir.',
  suggested: 'Önerilen yollar'
};
