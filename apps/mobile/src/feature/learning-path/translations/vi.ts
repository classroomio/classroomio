import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  pathLabel: 'Lộ trình học',
  courseCount: { other: '{count} khóa học' },
  coursesComplete: 'Đã hoàn thành {completed}/{total} khóa học',
  pathCompleted: 'Đã hoàn thành lộ trình',
  percentComplete: 'Hoàn thành {percent}',
  stateCompleted: 'Đã hoàn thành',
  stateInProgress: 'Đang học',
  stateNotStarted: 'Chưa bắt đầu',
  stateLocked: 'Đã khóa',
  finishToUnlock: 'Hoàn thành {course} để mở khóa',
  inOrder: 'Các khóa học mở khóa theo thứ tự.',
  anyOrder: 'Học các khóa theo thứ tự bất kỳ.',
  courses: 'Khóa học',
  join: 'Tham gia lộ trình',
  joined: 'Bạn đã tham gia {name}',
  joinFailed: 'Bạn chưa được thêm vào lộ trình này',
  start: 'Bắt đầu',
  nextUp: 'Tiếp theo: {title}',
  notJoinableInApp: 'Không thể tham gia lộ trình này trong ứng dụng.',
  loadError: 'Không tải được lộ trình học',
  emptyTitle: 'Chưa có lộ trình học',
  emptyDescription: 'Các lộ trình bạn tham gia được liệt kê ở đây cùng tiến độ từng khóa học.',
  suggested: 'Lộ trình gợi ý'
};
