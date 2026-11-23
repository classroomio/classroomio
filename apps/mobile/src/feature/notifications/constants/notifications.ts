import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
import { FlameIcon } from 'phosphor-react-native/src/icons/Flame';
import { GaugeIcon } from 'phosphor-react-native/src/icons/Gauge';
import { HandWavingIcon } from 'phosphor-react-native/src/icons/HandWaving';
import { ListChecksIcon } from 'phosphor-react-native/src/icons/ListChecks';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { PlugsConnectedIcon } from 'phosphor-react-native/src/icons/PlugsConnected';
import { StudentIcon } from 'phosphor-react-native/src/icons/Student';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { TrayIcon } from 'phosphor-react-native/src/icons/Tray';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import type { TNotificationCategory } from '@cio/utils/constants/notifications';

import type { AppIcon } from '@/feature/common/components/icon';
import type { IconTileTone } from '@/feature/common/components/icon-tile';

import type { en } from '@/feature/notifications/translations/en';
import type { NotificationChannel } from '@/feature/notifications/types/notifications';

type NotificationsKey = keyof typeof en;

export type NotificationCategoryDisplay = {
  label: NotificationsKey;
  description: NotificationsKey;
  icon: AppIcon;
  /** Tinted only where the category signals urgency; everything else stays neutral. */
  tone: IconTileTone;
};

/** Icon, tile tone and `notificationsCatalog` keys for each preference category. */
export const NOTIFICATION_CATEGORY_DISPLAY = {
  course_assigned: {
    label: 'categoryCourseAssigned',
    description: 'categoryCourseAssignedDescription',
    icon: BookOpenIcon,
    tone: 'neutral'
  },
  deadline_reminder: {
    label: 'categoryDeadlineReminder',
    description: 'categoryDeadlineReminderDescription',
    icon: ClockIcon,
    tone: 'warning'
  },
  overdue: { label: 'categoryOverdue', description: 'categoryOverdueDescription', icon: WarningIcon, tone: 'danger' },
  renewal_due: {
    label: 'categoryRenewalDue',
    description: 'categoryRenewalDueDescription',
    icon: ArrowsClockwiseIcon,
    tone: 'warning'
  },
  new_content: {
    label: 'categoryNewContent',
    description: 'categoryNewContentDescription',
    icon: MegaphoneIcon,
    tone: 'neutral'
  },
  exercise_graded: {
    label: 'categoryExerciseGraded',
    description: 'categoryExerciseGradedDescription',
    icon: CheckCircleIcon,
    tone: 'neutral'
  },
  community_reply: {
    label: 'categoryCommunityReply',
    description: 'categoryCommunityReplyDescription',
    icon: ChatCircleIcon,
    tone: 'neutral'
  },
  certificate_issued: {
    label: 'categoryCertificateIssued',
    description: 'categoryCertificateIssuedDescription',
    icon: MedalIcon,
    tone: 'neutral'
  },
  cohort_goal: {
    label: 'categoryCohortGoal',
    description: 'categoryCohortGoalDescription',
    icon: TargetIcon,
    tone: 'neutral'
  },
  live_session: {
    label: 'categoryLiveSession',
    description: 'categoryLiveSessionDescription',
    icon: VideoCameraIcon,
    tone: 'neutral'
  },
  new_assignment: {
    label: 'categoryNewAssignment',
    description: 'categoryNewAssignmentDescription',
    icon: ClipboardTextIcon,
    tone: 'neutral'
  },
  recommendation: {
    label: 'categoryRecommendation',
    description: 'categoryRecommendationDescription',
    icon: CompassIcon,
    tone: 'neutral'
  },
  goals: {
    label: 'categoryGoals',
    description: 'categoryGoalsDescription',
    icon: FlameIcon,
    tone: 'neutral'
  },
  tutor_reminder: {
    label: 'categoryTutorReminder',
    description: 'categoryTutorReminderDescription',
    icon: HandWavingIcon,
    tone: 'neutral'
  },
  grading: {
    label: 'categoryGrading',
    description: 'categoryGradingDescription',
    icon: TrayIcon,
    tone: 'neutral'
  },
  new_student: {
    label: 'categoryNewStudent',
    description: 'categoryNewStudentDescription',
    icon: UserPlusIcon,
    tone: 'neutral'
  },
  learner_attention: {
    label: 'categoryLearnerAttention',
    description: 'categoryLearnerAttentionDescription',
    icon: StudentIcon,
    tone: 'neutral'
  },
  attendance: {
    label: 'categoryAttendance',
    description: 'categoryAttendanceDescription',
    icon: ListChecksIcon,
    tone: 'neutral'
  },
  course_team: {
    label: 'categoryCourseTeam',
    description: 'categoryCourseTeamDescription',
    icon: UsersThreeIcon,
    tone: 'neutral'
  },
  plan_limits: {
    label: 'categoryPlanLimits',
    description: 'categoryPlanLimitsDescription',
    icon: GaugeIcon,
    tone: 'neutral'
  },
  billing: {
    label: 'categoryBilling',
    description: 'categoryBillingDescription',
    icon: CreditCardIcon,
    tone: 'neutral'
  },
  integrations: {
    label: 'categoryIntegrations',
    description: 'categoryIntegrationsDescription',
    icon: PlugsConnectedIcon,
    tone: 'neutral'
  }
} as const satisfies Record<TNotificationCategory, NotificationCategoryDisplay>;

/** Shown for a category this app version does not know, which a newer server can send. */
export const FALLBACK_CATEGORY_DISPLAY = {
  label: 'title',
  description: 'title',
  icon: BellIcon,
  tone: 'neutral'
} as const satisfies NotificationCategoryDisplay;

export const NOTIFICATION_PREFERENCE_SECTIONS: Array<{ title: NotificationsKey; categories: TNotificationCategory[] }> =
  [
    {
      title: 'sectionTraining',
      categories: ['course_assigned', 'new_assignment', 'deadline_reminder', 'overdue', 'renewal_due']
    },
    { title: 'sectionProgress', categories: ['exercise_graded', 'certificate_issued', 'goals'] },
    {
      title: 'sectionCommunity',
      categories: ['new_content', 'live_session', 'tutor_reminder', 'recommendation', 'community_reply']
    },
    {
      title: 'sectionTeaching',
      categories: ['grading', 'new_student', 'learner_attention', 'attendance', 'course_team']
    },
    { title: 'sectionOrganization', categories: ['plan_limits', 'billing', 'integrations'] }
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
