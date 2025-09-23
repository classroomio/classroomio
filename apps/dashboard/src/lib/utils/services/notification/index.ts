import { getAccessToken } from '$lib/utils/functions/supabase';

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
  NEWSFEED: 'NEWSFEED',
  INVITE_STUDENTS_TO_ORG: 'INVITE STUDENTS TO ORG',
  INVITE_STUDENT_TO_PRODUCT: 'INVITE STUDENT TO PRODUCT',
  WELCOME_TEACHER_TO_TESTPACK: 'WELCOME TEACHER TO TESTPACK',
  INVITE_STUDENT_TO_PRODUCT_COMPLETE: 'INVITE STUDENT TO PRODUCT COMPLETE'
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
  [NOTIFICATION_NAME.NEWSFEED]: '/api/email/course/newsfeed',
  [NOTIFICATION_NAME.INVITE_STUDENTS_TO_ORG]: '/api/email/invite/org',
  [NOTIFICATION_NAME.INVITE_STUDENT_TO_PRODUCT]: '/api/email/invite/product',
  [NOTIFICATION_NAME.WELCOME_TEACHER_TO_TESTPACK]: '/api/email/testpack/teacher_welcome',
  [NOTIFICATION_NAME.INVITE_STUDENT_TO_PRODUCT_COMPLETE]: '/api/email/invite/product/complete'
};

export const triggerSendEmail = async (
  name: string,
  body: { [k: string]: unknown },
  params?: {
    fetch?: typeof window.fetch;
    headers?: Record<string, string>;
  }
) => {
  try {
    console.log('params', params);
    const accessToken = await getAccessToken();
    const path = NAME_TO_PATH[name];

    if (!path) {
      console.error('Could not trigger send');
      return;
    }
    const response = await (params?.fetch || fetch)(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken,
        ...(params?.headers || {})
      },
      body: JSON.stringify(body)
    });

    if (![200, 303].includes(response.status)) {
      throw new Error(await response.text());
    }
  } catch (error) {
    console.error(name, error);
  }
};
