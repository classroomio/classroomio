import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  offline: 'Ngoại tuyến',
  youAreOffline: 'Bạn đang ngoại tuyến',
  syncsOnReconnect: 'Tiến độ sẽ đồng bộ khi bạn kết nối lại',
  changesWaiting: { other: '{count} thay đổi đang chờ đồng bộ' },
  changesWaitingSentence: { other: '{count} thay đổi đang chờ đồng bộ.' },
  changesWillSync: { other: '{count} thay đổi sẽ đồng bộ khi bạn kết nối lại.' },
  allSynced: 'Mọi dữ liệu ghi trên thiết bị này đã được đồng bộ.',
  synced: 'Đã đồng bộ',
  syncing: 'Đang đồng bộ',
  waitingToSync: 'Đang chờ đồng bộ',
  retryingAttempt: 'Đang tự động thử lại · lần {attempt}',
  notAccepted: 'Không được chấp nhận',
  notAcceptedReason: 'Không được chấp nhận: {reason}',
  lessonCompleted: 'Đã hoàn thành bài học',
  videoProgressAt: 'Tiến độ video tại {position}',
  videoProgress: 'Tiến độ video',
  updateCount: { other: '{count} lần cập nhật' },
  retry: 'Thử lại',
  syncTitle: 'Đồng bộ',
  syncNow: 'Đồng bộ ngay',
  signInToSave: 'Hãy đăng nhập lại để lưu tiến độ của bạn.'
};
