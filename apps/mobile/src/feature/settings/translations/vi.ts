import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  account: 'Tài khoản',
  name: 'Tên',
  notSet: 'Chưa đặt',
  email: 'Email',
  notifications: 'Thông báo',
  notificationsDescription: 'Đẩy, trong ứng dụng, email và giờ yên lặng',
  security: 'Bảo mật',
  theme: 'Giao diện',
  themeSystem: 'Hệ thống',
  themeLight: 'Sáng',
  themeDark: 'Tối',
  language: 'Ngôn ngữ',
  languageSystem: 'Hệ thống',
  languageSystemDescription: 'Theo ngôn ngữ của thiết bị',
  languageNotSaved: 'Chưa lưu ngôn ngữ vào tài khoản',
  about: 'Giới thiệu',
  version: 'Phiên bản',
  versionUnknown: 'Không rõ',
  server: 'Máy chủ',
  serverDescription: 'Đăng xuất để kết nối với máy chủ khác.'
};
