import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  title: 'Máy chủ',
  description: 'Tổ chức tự lưu trữ chạy API ClassroomIO riêng. Hãy dùng địa chỉ do quản trị viên cung cấp.',
  addressLabel: 'Địa chỉ API',
  addressPlaceholder: 'api.congtycuaban.vn',
  currently: 'Hiện tại: {host}',
  connect: 'Kết nối',
  useCloud: 'Dùng ClassroomIO cloud',
  updated: 'Đã cập nhật máy chủ',
  unusable: 'Không thể dùng máy chủ đó.',
  unreachable: 'Không thể kết nối với máy chủ đó. Hãy kiểm tra địa chỉ và kết nối.',
  notClassroomio: 'Địa chỉ đó không phản hồi như một máy chủ ClassroomIO.'
};
