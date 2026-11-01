import type { TNotificationType } from '../constants/notifications';
import type { EmailLocale } from '../email';
import {
  NOTIFICATION_COPY_MESSAGES,
  type NotificationCopyKey,
  type NotificationCopyMessages,
  type PluralCopy
} from './notification-copy-messages';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type NotificationCopyInput = {
  type: TNotificationType;
  courseTitle: string | null;
  actorName: string | null;
  subjectTitle: string | null;
  dueAt: string | null;
  startsAt: string | null;
  completedCount: number | null;
  requiredCount: number | null;
};

export type NotificationCopy = { title: string; body: string | null };

type PluralForm = keyof PluralCopy;

type CopyValues = Record<string, string | number>;

/** The supported language for a locale tag such as "pt-BR" or "de", else English. */
export function toNotificationCopyLocale(locale: string | null | undefined): EmailLocale {
  const language = locale?.toLowerCase().split(/[-_]/)[0];

  return language && language in NOTIFICATION_COPY_MESSAGES ? (language as EmailLocale) : 'en';
}

/** CLDR plural category for a whole number; kept local because Hermes has no `Intl.PluralRules`. */
function pluralFormOf(locale: EmailLocale, count: number): PluralForm {
  const n = Math.abs(Math.trunc(count));
  const lastDigit = n % 10;
  const lastTwo = n % 100;

  switch (locale) {
    case 'ru':
      if (lastDigit === 1 && lastTwo !== 11) return 'one';
      if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'few';
      return 'many';
    case 'pl':
      if (n === 1) return 'one';
      if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'few';
      return 'many';
    case 'fr':
    case 'hi':
    case 'pt':
      return n <= 1 ? 'one' : 'other';
    case 'vi':
      return 'other';
    default:
      return n === 1 ? 'one' : 'other';
  }
}

function interpolate(template: string, values: CopyValues | undefined) {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

function translatorFor(locale: EmailLocale) {
  const messages: NotificationCopyMessages = NOTIFICATION_COPY_MESSAGES[locale];

  return (key: NotificationCopyKey, values?: CopyValues) => {
    const message = messages[key] ?? NOTIFICATION_COPY_MESSAGES.en[key];
    if (typeof message === 'string') return interpolate(message, values);

    const form = pluralFormOf(locale, Number(values?.count ?? 0));

    return interpolate(message[form] ?? message.other, values);
  };
}

function toTime(value: string | null) {
  if (!value) return null;

  const time = new Date(value.includes('T') ? value : value.replace(' ', 'T')).getTime();

  return Number.isFinite(time) ? time : null;
}

/** "due in 3 days", "due tomorrow", "due today", "was due 2 days ago", in the given language. */
export function describeDue(dueAt: string | null, now: Date, locale: string | null | undefined = 'en'): string | null {
  const dueTime = toTime(dueAt);
  if (dueTime === null) return null;

  const t = translatorFor(toNotificationCopyLocale(locale));
  const days = Math.ceil((dueTime - now.getTime()) / DAY_MS);

  if (days > 1) return t('dueIn', { count: days });
  if (days === 1) return t('dueTomorrow');
  if (days === 0) return t('dueToday');

  return t('dueAgo', { count: Math.abs(days) });
}

/** "starts in 45 minutes", "starts in 1 hour", "starts in 2 days", "has started", in the given language. */
export function describeStart(
  startsAt: string | null,
  now: Date,
  locale: string | null | undefined = 'en'
): string | null {
  const startTime = toTime(startsAt);
  if (startTime === null) return null;

  const t = translatorFor(toNotificationCopyLocale(locale));
  const remaining = startTime - now.getTime();

  if (remaining <= 0) return t('started');
  if (remaining < HOUR_MS) return t('startsInMinutes', { count: Math.max(1, Math.round(remaining / MINUTE_MS)) });
  if (remaining < DAY_MS) return t('startsInHours', { count: Math.round(remaining / HOUR_MS) });

  return t('startsInDays', { count: Math.round(remaining / DAY_MS) });
}

/**
 * Title and body for a notification, rendered from its data at display time in the reader's language. Shared by the
 * push worker and the app so each type's wording lives in one place. Unsupported or missing locales render English.
 */
export function renderNotificationCopy(
  input: NotificationCopyInput,
  now: Date = new Date(),
  locale: string | null | undefined = 'en'
): NotificationCopy {
  const language = toNotificationCopyLocale(locale);
  const t = translatorFor(language);
  const course = input.courseTitle;
  const actor = input.actorName || t('someone');
  const due = describeDue(input.dueAt, now, language);

  switch (input.type) {
    case 'course_enrolled':
      return {
        title: course ? t('courseEnrolledTitle', { course }) : t('courseEnrolledTitleNoCourse'),
        body: input.actorName ? t('courseEnrolledBody', { actor: input.actorName }) : null
      };
    case 'compliance_due_soon': {
      const title = due
        ? course
          ? t('complianceDueTitle', { course, due })
          : t('complianceDueTitleNoCourse', { due })
        : course
          ? t('complianceDueSoonTitle', { course })
          : t('complianceDueSoonTitleNoCourse');

      return { title, body: t('complianceDueBody') };
    }
    case 'compliance_renewal_due': {
      const title = due
        ? course
          ? t('renewalDueTitle', { course, due })
          : t('renewalDueTitleNoCourse', { due })
        : course
          ? t('renewalSoonTitle', { course })
          : t('renewalSoonTitleNoCourse');

      return { title, body: t('renewalBody') };
    }
    case 'compliance_overdue':
      return {
        title: course ? t('overdueTitle', { course }) : t('overdueTitleNoCourse'),
        body: due ? t('overdueBody', { due }) : null
      };
    case 'newsfeed_post':
      return {
        title: course ? t('newsfeedPostTitle', { course }) : t('newsfeedPostTitleNoCourse'),
        body: input.actorName ? t('fromActor', { actor: input.actorName }) : null
      };
    case 'lesson_published':
      return {
        title: course ? t('lessonPublishedTitle', { course }) : t('lessonPublishedTitleNoCourse'),
        body: input.subjectTitle
      };
    case 'exercise_graded':
      return {
        title: input.subjectTitle
          ? t('exerciseGradedTitle', { exercise: input.subjectTitle })
          : t('exerciseGradedTitleNoExercise'),
        body: input.courseTitle
      };
    case 'community_answer':
      return { title: t('communityAnswerTitle', { actor }), body: input.subjectTitle };
    case 'newsfeed_comment':
      return { title: t('newsfeedCommentTitle', { actor }), body: input.courseTitle };
    case 'newsfeed_reply':
      return { title: t('newsfeedReplyTitle', { actor }), body: input.courseTitle };
    case 'certificate_issued':
      return {
        title: course ? t('certificateTitle', { course }) : t('certificateTitleNoCourse'),
        body: t('certificateBody')
      };
    case 'cohort_goal_due': {
      const goal = input.subjectTitle || t('cohortGoalFallback');
      const progress =
        input.requiredCount !== null && input.requiredCount > 0
          ? t('cohortGoalProgress', { completed: input.completedCount ?? 0, count: input.requiredCount })
          : null;

      return { title: due ? t('cohortGoalTitle', { goal, due }) : goal, body: progress };
    }
    case 'live_session_reminder': {
      const session = input.subjectTitle || t('liveSessionFallback');
      const start = describeStart(input.startsAt, now, language);

      return { title: start ? t('liveSessionTitle', { session, start }) : session, body: input.courseTitle };
    }
  }
}
