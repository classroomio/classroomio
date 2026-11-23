import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  upcomingTitle: 'Lớp trực tiếp sắp tới',
  liveNow: 'Đang diễn ra',
  timeRange: '{day}, {start}–{end}',
  timeAt: '{day}, {start}',
  courseWithHost: '{course} · {host}',
  register: 'Đăng ký',
  registered: 'Đã đăng ký',
  cancelRegistration: 'Hủy đăng ký',
  joinNow: 'Tham gia ngay',
  addToCalendar: 'Thêm vào lịch',
  paidCourse: 'Ghi danh trên trang web để tham gia.',
  registerFailed: 'Chưa đăng ký được',
  unregisterFailed: 'Chưa hủy được đăng ký',
  calendarFailed: 'Không mở được lịch'
};
