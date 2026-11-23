import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Próximas aulas ao vivo',
  liveNow: 'Ao vivo agora',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Inscrever-se',
  registered: 'Inscrito',
  cancelRegistration: 'Cancelar inscrição',
  joinNow: 'Entrar agora',
  addToCalendar: 'Adicionar à agenda',
  paidCourse: 'Inscreva-se no site para participar.',
  registerFailed: 'A inscrição não foi feita',
  unregisterFailed: 'Sua inscrição não foi cancelada',
  calendarFailed: 'A agenda não abriu'
};
