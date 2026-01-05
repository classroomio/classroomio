/**
 * Auto-import all email definitions to register them in the registry
 *
 * When this module is imported, all emails are automatically registered
 * and available for use with the send() function.
 */

// Import all email definitions (side effect: registers them)
export * from './forgot-password';
export * from './welcome';
export * from './verify-email';
export * from './on-password-reset';
export * from './invite-teacher';
export * from './newsfeed';
export * from './student-course-welcome';
export * from './teacher-student-joined';
export * from './teacher-student-buy-request';
export * from './student-prove-payment';
export * from './teacher-course-welcome';
export * from './payment-success-student';
export * from './payment-success-teacher';

import type { newsfeedCommentEmail, newsfeedPostEmail } from './newsfeed';

// Import types for schema mapping (must be after exports to avoid circular dependency)
import type { forgotPasswordEmail } from './forgot-password';
import type { inviteTeacherEmail } from './invite-teacher';
import type { onPasswordResetEmail } from './on-password-reset';
import type { paymentSuccessStudentEmail } from './payment-success-student';
import type { paymentSuccessTeacherEmail } from './payment-success-teacher';
import type { studentCourseWelcomeEmail } from './student-course-welcome';
import type { studentProvePaymentEmail } from './student-prove-payment';
import type { teacherCourseWelcomeEmail } from './teacher-course-welcome';
import type { teacherStudentBuyRequestEmail } from './teacher-student-buy-request';
import type { teacherStudentJoinedEmail } from './teacher-student-joined';
import type { verifyEmailEmail } from './verify-email';
import type { welcomeEmail } from './welcome';

/**
 * Type mapping that maps each EmailId to its corresponding Zod schema type
 * This is used for compile-time type inference in sendEmail()
 *
 * **Important**: When adding a new email, add its schema mapping here!
 */
export type EmailSchemas = {
  forgotPassword: typeof forgotPasswordEmail.template.schema;
  welcome: typeof welcomeEmail.template.schema;
  verifyEmail: typeof verifyEmailEmail.template.schema;
  onPasswordReset: typeof onPasswordResetEmail.template.schema;
  inviteTeacher: typeof inviteTeacherEmail.template.schema;
  newsfeedPost: typeof newsfeedPostEmail.template.schema;
  newsfeedComment: typeof newsfeedCommentEmail.template.schema;
  studentCourseWelcome: typeof studentCourseWelcomeEmail.template.schema;
  teacherStudentJoined: typeof teacherStudentJoinedEmail.template.schema;
  teacherStudentBuyRequest: typeof teacherStudentBuyRequestEmail.template.schema;
  studentProvePayment: typeof studentProvePaymentEmail.template.schema;
  teacherCourseWelcome: typeof teacherCourseWelcomeEmail.template.schema;
  paymentSuccessStudent: typeof paymentSuccessStudentEmail.template.schema;
  paymentSuccessTeacher: typeof paymentSuccessTeacherEmail.template.schema;
};
