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

// Import types for schema mapping (must be after exports to avoid circular dependency)
import type { forgotPasswordEmail } from './forgot-password';
import type { inviteTeacherEmail } from './invite-teacher';
import type { onPasswordResetEmail } from './on-password-reset';
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
};
