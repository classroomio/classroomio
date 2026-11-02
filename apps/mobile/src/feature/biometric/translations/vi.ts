import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  methodFingerprint: 'vân tay',
  methodFaceUnlock: 'khuôn mặt',
  methodBiometrics: 'sinh trắc học',
  lockDuration: { other: '{count} phút' },
  settingDescription: 'Yêu cầu khi bạn mở ứng dụng và sau {duration} chạy nền.',
  settingSetUp: 'Để dùng tùy chọn này, hãy thiết lập {method} trong cài đặt thiết bị.',
  settingUnsupported: 'Thiết bị này không hỗ trợ mở khóa sinh trắc học.',
  turnOnPrompt: 'Bật mở khóa bằng {method}',
  stillOff: 'Mở khóa bằng {method} vẫn đang tắt',
  unlockWith: 'Mở khóa bằng {method}',
  offerTitle: 'Mở khóa bằng {method}?',
  offerDescription:
    'ClassroomIO sẽ yêu cầu {method} khi bạn mở ứng dụng và khi bạn quay lại sau {duration}. Bạn vẫn được đăng nhập trong cả hai trường hợp. Bạn có thể thay đổi trong Cài đặt.',
  notNow: 'Để sau',
  turnOn: 'Bật',
  isOn: 'Đã bật mở khóa bằng {method}',
  isOnDescription: 'Bạn có thể tắt trong Cài đặt.',
  isOff: 'Đã tắt mở khóa bằng {method}',
  unlockPrompt: 'Mở khóa ClassroomIO',
  lockedTitle: 'ClassroomIO đang bị khóa',
  lockedDescription: 'Dùng {method} để tiếp tục.',
  lockedDescriptionWithEmail: 'Đã đăng nhập bằng {email}. Dùng {method} để tiếp tục.',
  errorLockout: '{method} đã bị khóa do thử quá nhiều lần. Hãy dùng mật mã thiết bị.',
  errorNotSetUp: 'Chưa thiết lập {method} trên thiết bị này.',
  errorNotRecognized: '{method} không nhận ra bạn. Hãy thử lại.'
};
