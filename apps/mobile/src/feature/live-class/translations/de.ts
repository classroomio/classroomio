import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Anstehende Live-Sitzungen',
  liveNow: 'Jetzt live',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Anmelden',
  registered: 'Angemeldet',
  cancelRegistration: 'Anmeldung zurückziehen',
  joinNow: 'Jetzt teilnehmen',
  addToCalendar: 'Zum Kalender hinzufügen',
  paidCourse: 'Schreiben Sie sich auf der Website ein, um teilzunehmen.',
  registerFailed: 'Sie wurden nicht angemeldet',
  unregisterFailed: 'Ihre Anmeldung wurde nicht zurückgezogen',
  calendarFailed: 'Der Kalender wurde nicht geöffnet'
};
