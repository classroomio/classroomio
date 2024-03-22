import { supabase } from '$lib/utils/functions/supabase';

export const NOTIFICATION_NAME = {
  WELCOME_TO_APP: 'WELCOME TO APP',
  VERIFY_EMAIL: 'VERFIY_EMAIL',
  INVITE_TEACHER: 'INVITE TEACHER',
  WELCOME_TEACHER_TO_COURSE: 'WELCOME TEACHER TO COURSE',
  SEND_TEACHER_STUDENT_BUY_REQUEST: 'SEND TEACHER STUDENT BUY REQUEST',
  STUDENT_PROOVE_COURSE_PAYMENT: 'STUDENT PROOVE COURSE PAYMENT',
  STUDENT_COURSE_WELCOME: 'STUDENT COURSE WELCOME',
  TEACHER_STUDENT_JOINED: 'TEACHER STUDENT JOINED',
  SUBMISSION_UPDATE: 'SUBMISSION UPDATE',
  EXERCISE_SUBMISSION_UPDATE: 'EXERCISE SUBMISSION UPDATE',
  NEWSFEED: 'NEWSFEED'
};

const NAME_TO_PATH = {
  [NOTIFICATION_NAME.WELCOME_TO_APP]: '/api/email/welcome',
  [NOTIFICATION_NAME.VERIFY_EMAIL]: '/api/email/verify_email',
  [NOTIFICATION_NAME.INVITE_TEACHER]: '/api/email/invite',
  [NOTIFICATION_NAME.WELCOME_TEACHER_TO_COURSE]: '/api/email/course/teacher_welcome',
  [NOTIFICATION_NAME.SEND_TEACHER_STUDENT_BUY_REQUEST]:
    '/api/email/course/teacher_student_buycourse',
  [NOTIFICATION_NAME.STUDENT_PROOVE_COURSE_PAYMENT]: '/api/email/course/student_prove_payment',
  [NOTIFICATION_NAME.STUDENT_COURSE_WELCOME]: '/api/email/course/student_welcome',
  [NOTIFICATION_NAME.TEACHER_STUDENT_JOINED]: '/api/email/course/teacher_student_joined',
  [NOTIFICATION_NAME.SUBMISSION_UPDATE]: '/api/email/course/submission_update',
  [NOTIFICATION_NAME.EXERCISE_SUBMISSION_UPDATE]: '/api/email/course/exercise_submission_update',
  [NOTIFICATION_NAME.NEWSFEED]: '/api/email/course/newsfeed'
};

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
};

export const triggerSendEmail = async (name: string, body: { [k: string]: unknown }) => {
  try {
    const accessToken = await getAccessToken();
    const path = NAME_TO_PATH[name];

    if (!path) {
      console.error('Could not trigger send');
      return;
    }
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      console.log(response);
      throw new Error(await response.text());
    }
  } catch (error) {
    console.error(name, error);
  }
};
