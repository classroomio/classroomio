import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Kommende liveundervisning',
  liveNow: 'Live nu',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Tilmeld',
  registered: 'Tilmeldt',
  cancelRegistration: 'Annuller tilmelding',
  joinNow: 'Deltag nu',
  addToCalendar: 'Føj til kalender',
  paidCourse: 'Tilmeld dig på hjemmesiden for at deltage.',
  registerFailed: 'Du blev ikke tilmeldt',
  unregisterFailed: 'Din tilmelding blev ikke annulleret',
  calendarFailed: 'Kalenderen blev ikke åbnet'
};
