import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const vi: TranslatedMessages<typeof en> = {
  streakDays: { other: 'Chuỗi {count} ngày' },
  noStreak: 'Chưa có chuỗi ngày học',
  noStreakDescription: 'Hoàn thành một bài học, nộp bài tập hoặc tham gia lớp trực tiếp để bắt đầu.',
  activeToday: 'Hôm nay bạn đã học.',
  notActiveToday: 'Hãy học hôm nay để giữ chuỗi ngày học.',
  bestStreak: { other: 'Tốt nhất: {count} ngày' },
  weekendNote: 'Cuối tuần không làm đứt chuỗi ngày học.',
  dayActive: '{day}, đã học',
  dayInactive: '{day}, không học',
  weeklyTitle: 'Mục tiêu bài học hằng tuần',
  weeklyProgress: '{completed}/{target} bài học tuần này',
  weeklyReached: 'Bạn đã đạt mục tiêu tuần này.',
  targetLabel: { other: '{count} bài học mỗi tuần' },
  lowerTarget: 'Giảm mục tiêu tuần',
  raiseTarget: 'Tăng mục tiêu tuần',
  goalNotSaved: 'Chưa lưu được mục tiêu tuần',
  milestonesTitle: 'Cột mốc',
  milestoneName: { other: 'Chuỗi {count} ngày' },
  milestoneAchieved: 'Đã đạt',
  milestoneRemaining: { other: 'Còn {count} ngày' },
  streakUnit: { other: 'ngày liên tiếp' },
  weeklyRemaining: { other: 'Còn {count} bài học nữa để đạt mục tiêu.' },
  ofTarget: 'trên {target}',
  nextMilestoneTitle: 'Cột mốc tiếp theo',
  milestoneProgress: { other: '{current}/{count} ngày' },
  allMilestonesEarned: 'Bạn đã đạt mọi cột mốc.',
  loadError: 'Không tải được mục tiêu',
  welcomeTitle: { other: 'Chuỗi {count} ngày' },
  welcomeDescription: 'Hãy học gì đó hôm nay để duy trì chuỗi.',
  welcomeDescriptionActive: 'Hôm nay bạn đã học rồi.',
  welcomeResume: 'Tiếp tục từ chỗ đã dừng',
  welcomeExplore: 'Khám phá khóa học mới',
  welcomeDismiss: 'Đóng'
};
