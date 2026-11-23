import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Nadchodzące zajęcia na żywo',
  liveNow: 'Teraz na żywo',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Zapisz się',
  registered: 'Zapisano',
  cancelRegistration: 'Anuluj zapis',
  joinNow: 'Dołącz teraz',
  addToCalendar: 'Dodaj do kalendarza',
  paidCourse: 'Zapisz się na stronie internetowej, aby wziąć udział.',
  registerFailed: 'Nie zapisano Cię',
  unregisterFailed: 'Nie anulowano zapisu',
  calendarFailed: 'Nie otwarto kalendarza'
};
