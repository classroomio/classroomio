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
  serverDescription: 'Đăng xuất để kết nối với máy chủ khác.',
  appearance: 'Giao diện',
  general: 'Chung',
  videoAndDownloads: 'Video và tải xuống',
  videoQuality: 'Chất lượng phát trực tuyến',
  videoQualityAuto: 'Tự động',
  videoQualityAutoDescription: 'Chất lượng tốt nhất mà kết nối của bạn cho phép',
  videoQualityStandard: 'Tối đa 720p',
  videoQualityStandardDescription: 'Dùng ít dữ liệu di động hơn',
  videoQualityDataSaver: 'Tiết kiệm dữ liệu',
  videoQualityDataSaverDescription: 'Tối đa 480p, dùng ít dữ liệu di động nhất',
  videoQualityFooter:
    'Đặt độ phân giải cao nhất cho video mà tổ chức của bạn phát trực tuyến. Không áp dụng cho bài học đã tải xuống và video từ YouTube hoặc Vimeo.',
  downloads: 'Tải xuống'
};
