import { env } from '../config/env';

export const EMAIL_IDS = [
  'forgotPassword',
  'welcome',
  'verifyEmail',
  'onPasswordReset',
  'inviteTeacher',
  'newsfeedPost',
  'newsfeedComment',
  'studentCourseWelcome',
  'studentCourseInvite',
  'teacherStudentJoined',
  'teacherStudentBuyRequest',
  'studentProvePayment',
  'teacherCourseWelcome'
] as const;

const DEFAULT_EMAIL_FROM = '"Best from ClassroomIO" <notify@mail.classroomio.com>';

export const EMAIL_FROM = env.SMTP_SENDER || DEFAULT_EMAIL_FROM;
export const EMAIL_REPLY_TO = '"Best from ClassroomIO" <help@classroomio.com>';
