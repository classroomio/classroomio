import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import type { AppIcon } from '@/feature/common/components/icon';
import type { TNotificationCategory } from '@cio/utils/constants/notifications';

import type { en } from '@/feature/notifications/translations/en';
import type { NotificationChannel } from '@/feature/notifications/types/notifications';

type NotificationsKey = keyof typeof en;

/** Icon and `notificationsCatalog` keys for each preference category. */
export const NOTIFICATION_CATEGORY_DISPLAY = {
  course_assigned: {
    label: 'categoryCourseAssigned',
    description: 'categoryCourseAssignedDescription',
    icon: BookOpenIcon
  },
  deadline_reminder: {
    label: 'categoryDeadlineReminder',
    description: 'categoryDeadlineReminderDescription',
    icon: ClockIcon
  },
  overdue: { label: 'categoryOverdue', description: 'categoryOverdueDescription', icon: WarningIcon },
  renewal_due: { label: 'categoryRenewalDue', description: 'categoryRenewalDueDescription', icon: ArrowsClockwiseIcon },
  new_content: { label: 'categoryNewContent', description: 'categoryNewContentDescription', icon: MegaphoneIcon },
  exercise_graded: {
    label: 'categoryExerciseGraded',
    description: 'categoryExerciseGradedDescription',
    icon: CheckCircleIcon
  },
  community_reply: {
    label: 'categoryCommunityReply',
    description: 'categoryCommunityReplyDescription',
    icon: ChatCircleIcon
  },
  certificate_issued: {
    label: 'categoryCertificateIssued',
    description: 'categoryCertificateIssuedDescription',
    icon: MedalIcon
  },
  cohort_goal: { label: 'categoryCohortGoal', description: 'categoryCohortGoalDescription', icon: TargetIcon },
  live_session: { label: 'categoryLiveSession', description: 'categoryLiveSessionDescription', icon: VideoCameraIcon }
} as const satisfies Record<
  TNotificationCategory,
  { label: NotificationsKey; description: NotificationsKey; icon: AppIcon }
>;

export const NOTIFICATION_PREFERENCE_SECTIONS: Array<{ title: NotificationsKey; categories: TNotificationCategory[] }> =
  [
    { title: 'sectionTraining', categories: ['course_assigned', 'deadline_reminder', 'overdue', 'renewal_due'] },
    { title: 'sectionProgress', categories: ['exercise_graded', 'certificate_issued', 'cohort_goal'] },
    { title: 'sectionCommunity', categories: ['new_content', 'live_session', 'community_reply'] }
  ];

export const NOTIFICATION_CHANNEL_KEYS = {
  push: 'channelPush',
  inApp: 'channelInApp',
  email: 'channelEmail'
} as const satisfies Record<NotificationChannel, NotificationsKey>;

export const NOTIFICATION_CHANNEL_NOTE_KEYS = {
  push: 'channelPushNote',
  inApp: 'channelInAppNote',
  email: 'channelEmailNote'
} as const satisfies Record<NotificationChannel, NotificationsKey>;

export const NOTIFICATIONS_PAGE_SIZE = 20;

/** Sessions after which the push pre-prompt may appear, so it never interrupts a first launch. */
export const PUSH_PROMPT_MIN_SESSIONS = 2;

export const PUSH_PROMPT_DELAY_MS = 4000;

export const PUSH_PROMPT_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'default';
