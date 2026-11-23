import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Yaklaşan canlı dersler',
  liveNow: 'Şu anda canlı',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Kaydol',
  registered: 'Kaydoldunuz',
  cancelRegistration: 'Kaydı iptal et',
  joinNow: 'Şimdi katıl',
  addToCalendar: 'Takvime ekle',
  paidCourse: 'Katılmak için web sitesinden kaydolun.',
  registerFailed: 'Kaydınız yapılmadı',
  unregisterFailed: 'Kaydınız iptal edilmedi',
  calendarFailed: 'Takvim açılmadı'
};
