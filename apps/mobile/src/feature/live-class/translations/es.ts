import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Próximas clases en directo',
  liveNow: 'En directo ahora',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Inscribirse',
  registered: 'Inscrito',
  cancelRegistration: 'Cancelar inscripción',
  joinNow: 'Unirse ahora',
  addToCalendar: 'Añadir al calendario',
  paidCourse: 'Inscríbete en el sitio web para asistir.',
  registerFailed: 'No se completó la inscripción',
  unregisterFailed: 'No se canceló tu inscripción',
  calendarFailed: 'El calendario no se abrió'
};
