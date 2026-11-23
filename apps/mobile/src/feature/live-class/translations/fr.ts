import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Prochains cours en direct',
  liveNow: 'En direct',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'S’inscrire',
  registered: 'Inscrit',
  cancelRegistration: 'Annuler l’inscription',
  joinNow: 'Rejoindre',
  addToCalendar: 'Ajouter au calendrier',
  paidCourse: 'Inscrivez-vous sur le site web pour y assister.',
  registerFailed: 'L’inscription n’a pas abouti',
  unregisterFailed: 'Votre inscription n’a pas été annulée',
  calendarFailed: 'Le calendrier ne s’est pas ouvert'
};
