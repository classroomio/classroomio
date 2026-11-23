import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Ближайшие онлайн-занятия',
  liveNow: 'Идёт сейчас',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Записаться',
  registered: 'Вы записаны',
  cancelRegistration: 'Отменить запись',
  joinNow: 'Подключиться',
  addToCalendar: 'Добавить в календарь',
  paidCourse: 'Чтобы участвовать, запишитесь на курс на сайте.',
  registerFailed: 'Не удалось записаться',
  unregisterFailed: 'Запись не отменена',
  calendarFailed: 'Календарь не открылся'
};
