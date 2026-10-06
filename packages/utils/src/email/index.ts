import { STUDENT_EMAIL_CATALOG } from './catalog';
export { getStudentEmailSampleValues } from './sample-values';

export const EMAIL_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr'] as const;

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

export const STUDENT_EMAIL_IDS = [
  'studentCourseInvite',
  'studentCourseWelcome',
  'studentCourseCompletion',
  'studentOrgInvite',
  'studentCohortWelcome',
  'studentProvePayment',
  'cohortGoalReminder',
  'quizAssigned',
  'sessionReminder',
  'sessionUpdated',
  'submissionGraded',
  'newsfeedPost'
] as const;

export type StudentEmailId = (typeof STUDENT_EMAIL_IDS)[number];

const STUDENT_EMAIL_SUBMISSION_STATUSES: Record<
  EmailLocale,
  { submitted: string; inProgress: string; graded: string; updated: string }
> = {
  en: { submitted: 'Submitted', inProgress: 'In progress', graded: 'Graded', updated: 'Updated' },
  hi: { submitted: 'सबमिट किया गया', inProgress: 'प्रगति में', graded: 'मूल्यांकित', updated: 'अपडेट किया गया' },
  fr: { submitted: 'Envoyé', inProgress: 'En cours', graded: 'Évalué', updated: 'Mis à jour' },
  pt: { submitted: 'Enviado', inProgress: 'Em andamento', graded: 'Avaliado', updated: 'Atualizado' },
  de: { submitted: 'Eingereicht', inProgress: 'In Bearbeitung', graded: 'Bewertet', updated: 'Aktualisiert' },
  vi: { submitted: 'Đã nộp', inProgress: 'Đang thực hiện', graded: 'Đã chấm', updated: 'Đã cập nhật' },
  ru: { submitted: 'Отправлено', inProgress: 'В процессе', graded: 'Проверено', updated: 'Обновлено' },
  es: { submitted: 'Enviado', inProgress: 'En curso', graded: 'Calificado', updated: 'Actualizado' },
  pl: { submitted: 'Wysłano', inProgress: 'W trakcie', graded: 'Oceniono', updated: 'Zaktualizowano' },
  da: { submitted: 'Indsendt', inProgress: 'I gang', graded: 'Bedømt', updated: 'Opdateret' },
  tr: { submitted: 'Gönderildi', inProgress: 'Devam ediyor', graded: 'Değerlendirildi', updated: 'Güncellendi' }
};

export function getStudentEmailSubmissionStatusLabel(statusId: number, locale: EmailLocale): string {
  const status = STUDENT_EMAIL_SUBMISSION_STATUSES[locale];
  if (statusId === 1) return status.submitted;
  if (statusId === 2) return status.inProgress;
  if (statusId === 3) return status.graded;
  return status.updated;
}

export interface StudentEmailTemplateOverride {
  content: string;
  subject?: string;
}

export type StudentEmailTemplateOverrides = Partial<
  Record<StudentEmailId, Partial<Record<EmailLocale, StudentEmailTemplateOverride>>>
>;

export interface StudentEmailTemplateCopy {
  subject: string;
  body: string;
  cta?: string;
  ctaWhenScored?: string;
}

export interface StudentEmailLocaleCopy {
  footer: {
    rightsReserved: string;
    website: string;
    terms: string;
    privacy: string;
  };
  templates: Record<StudentEmailId, StudentEmailTemplateCopy>;
}

export const STUDENT_EMAIL_VARIABLES: Record<StudentEmailId, readonly string[]> = {
  studentCourseInvite: ['org_name', 'course_name', 'expires_at'],
  studentCourseWelcome: ['org_name', 'course_name'],
  studentCourseCompletion: ['org_name', 'course_name', 'student_name', 'course_message'],
  studentOrgInvite: ['org_name', 'expires_at', 'course_names'],
  studentCohortWelcome: ['org_name', 'cohort_name'],
  studentProvePayment: ['org_name', 'course_name', 'student_name', 'teacher_email'],
  cohortGoalReminder: ['org_name', 'cohort_name', 'goal_title', 'due_status', 'completed_count', 'required_count'],
  quizAssigned: ['org_name', 'course_name', 'exercise_title'],
  sessionReminder: ['org_name', 'course_name', 'session_title', 'session_time', 'when'],
  sessionUpdated: ['org_name', 'course_name', 'session_title', 'session_time'],
  submissionGraded: ['org_name', 'student_name', 'exercise_title', 'course_name', 'status', 'score', 'lesson_title'],
  newsfeedPost: ['org_name', 'course_name', 'teacher_name', 'post_content']
};

export const STUDENT_EMAIL_LINKS: Partial<Record<StudentEmailId, string>> = {
  studentCourseInvite: 'action_url',
  studentCourseWelcome: 'action_url',
  studentCourseCompletion: 'action_url',
  studentOrgInvite: 'action_url',
  studentCohortWelcome: 'action_url',
  cohortGoalReminder: 'action_url',
  quizAssigned: 'action_url',
  sessionReminder: 'action_url',
  sessionUpdated: 'action_url',
  submissionGraded: 'action_url',
  newsfeedPost: 'action_url'
};

export function isEmailLocale(value: unknown): value is EmailLocale {
  return typeof value === 'string' && EMAIL_LOCALES.some((locale) => locale === value);
}

function normalizeStudentEmailBody(content: string): string {
  return content
    .replace(/<p>\s*({{[a-z_]+}})\s*<\/p>/g, '$1')
    .replace(/>\s+</g, '><')
    .trim();
}

function normalizeStudentEmailSubject(subject: string): string {
  return subject.replace(/\s+/g, ' ').trim();
}

export function isStudentEmailTemplateCustomized(input: {
  emailId: StudentEmailId;
  locale: EmailLocale;
  content: string;
  subject?: string | null;
}): boolean {
  const defaultCopy = STUDENT_EMAIL_CATALOG[input.locale].templates[input.emailId];

  return (
    normalizeStudentEmailBody(input.content) !== normalizeStudentEmailBody(defaultCopy.body) ||
    (input.subject != null &&
      normalizeStudentEmailSubject(input.subject) !== normalizeStudentEmailSubject(defaultCopy.subject))
  );
}

export function resolveStudentEmailLocale(input: {
  isEligible: boolean;
  enforced: boolean;
  locale: unknown;
}): EmailLocale {
  if (!input.isEligible) return 'en';

  return input.enforced && isEmailLocale(input.locale) ? input.locale : 'en';
}

export function isStudentEmailId(value: unknown): value is StudentEmailId {
  return typeof value === 'string' && STUDENT_EMAIL_IDS.some((emailId) => emailId === value);
}

export function getUnknownStudentEmailVariables(emailId: StudentEmailId, content: string): string[] {
  const allowedVariables = new Set(STUDENT_EMAIL_VARIABLES[emailId]);
  const bodyWithoutActionUrl = STUDENT_EMAIL_LINKS[emailId]
    ? content.replace(/href\s*=\s*(['"]){{\s*action_url\s*}}\1/gi, '')
    : content;
  const variables = [...bodyWithoutActionUrl.matchAll(/{{([\s\S]*?)}}/g)].map((match) => match[1].trim());

  return [...new Set(variables.filter((variable) => !allowedVariables.has(variable)))];
}

export function containsStudentEmailActionLink(content: string): boolean {
  return /href\s*=\s*(['"]){{\s*action_url\s*}}\1/i.test(content);
}

export { STUDENT_EMAIL_CATALOG };
