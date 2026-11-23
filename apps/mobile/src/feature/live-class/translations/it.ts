import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Prossime lezioni dal vivo',
  liveNow: 'In diretta ora',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Iscriviti',
  registered: 'Iscritto',
  cancelRegistration: 'Annulla iscrizione',
  joinNow: 'Partecipa ora',
  addToCalendar: 'Aggiungi al calendario',
  paidCourse: 'Iscriviti dal sito web per partecipare.',
  registerFailed: 'L’iscrizione non è riuscita',
  unregisterFailed: 'L’iscrizione non è stata annullata',
  calendarFailed: 'Il calendario non si è aperto'
};
