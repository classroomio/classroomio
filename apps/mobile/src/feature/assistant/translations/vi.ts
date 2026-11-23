import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  title: 'Hỏi AI',
  description: 'Về khóa học và mục tiêu của bạn',
  emptyTitle: 'Hỏi về việc học của bạn',
  emptyDescription: 'Hỏi về khóa học, hạn sắp tới hoặc cách đạt mục tiêu tuần.',
  placeholder: 'Đặt câu hỏi',
  inputLabel: 'Câu hỏi cho trợ lý',
  send: 'Gửi',
  stop: 'Dừng trả lời',
  stopped: 'Câu trả lời đã dừng. Hãy hỏi lại.',
  requestFailed: 'Trợ lý chưa trả lời',
  capReachedTitle: 'Đã hết lượt hỏi tháng này',
  capReachedDescription: 'Tổ chức của bạn quy định số câu hỏi mỗi học viên được hỏi.',
  poolExhaustedTitle: 'Trợ lý hiện không khả dụng',
  poolExhaustedDescription: 'Tổ chức đã dùng hết hạn mức AI tháng này.',
  disabledTitle: 'Trợ lý đang tắt',
  disabledDescription: 'Tổ chức chưa bật gia sư AI.',
  notConfiguredTitle: 'Trợ lý hiện không khả dụng',
  notConfiguredDescription: 'Máy chủ này chưa cấu hình nhà cung cấp AI.',
  noCoursesTitle: 'Hãy tham gia một khóa học trước',
  noCoursesDescription: 'Trợ lý trả lời câu hỏi về các khóa học bạn đã ghi danh.'
};
