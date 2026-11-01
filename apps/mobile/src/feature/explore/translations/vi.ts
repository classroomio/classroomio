import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  screenTitle: 'Khám phá',
  entryTitle: 'Khám phá khóa học',
  entryDescription: 'Các khóa học bạn có thể đăng ký',
  searchCourses: 'Tìm khóa học',
  emptyTitle: 'Không có khóa học khác',
  emptyDescription: 'Tổ chức của bạn không có khóa học nào khác dành cho bạn.',
  searchNoResultsTitle: 'Không có khóa học phù hợp',
  searchNoResultsDescription: 'Không có tiêu đề khóa học nào chứa “{query}”.',
  loadError: 'Không tải được các khóa học',
  courseLoadError: 'Không tải được khóa học này',
  about: 'Giới thiệu khóa học',
  goals: 'Bạn sẽ học được gì',
  requirements: 'Yêu cầu',
  enroll: 'Đăng ký',
  goToCourse: 'Đến khóa học',
  enrolledToast: 'Bạn đã đăng ký {title}',
  enrollFailed: 'Chưa đăng ký được',
  enrollFull: 'Khóa học này hiện không nhận học viên mới. Hãy liên hệ tổ chức của bạn.',
  enrollMembersOnly: 'Chỉ thành viên của tổ chức này mới có thể đăng ký. Hãy xin lời mời từ quản trị viên.',
  enrollUnavailable: 'Không thể đăng ký khóa học này trong ứng dụng.',
  paidNotAvailable: 'Không thể đăng ký khóa học này trong ứng dụng.',
  inviteOnly: 'Tổ chức của bạn sẽ đăng ký học viên vào khóa học này.',
  originalPrice: 'Giá gốc {price}'
};
