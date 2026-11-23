import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  upcomingTitle: 'आगामी लाइव क्लास',
  liveNow: 'अभी लाइव',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'रजिस्टर करें',
  registered: 'रजिस्टर हो गया',
  cancelRegistration: 'रजिस्ट्रेशन रद्द करें',
  joinNow: 'अभी जुड़ें',
  addToCalendar: 'कैलेंडर में जोड़ें',
  paidCourse: 'भाग लेने के लिए वेबसाइट पर नामांकन करें।',
  registerFailed: 'आपका रजिस्ट्रेशन नहीं हुआ',
  unregisterFailed: 'आपका रजिस्ट्रेशन रद्द नहीं हुआ',
  calendarFailed: 'कैलेंडर नहीं खुला'
};
