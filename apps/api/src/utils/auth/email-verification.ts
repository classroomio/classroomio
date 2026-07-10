import { AppError, ErrorCodes } from '@api/utils/errors';

type EmailVerificationUser = {
  emailVerified?: boolean | null;
};

export function assertEmailVerified(user: EmailVerificationUser): void {
  if (user.emailVerified) {
    return;
  }

  throw new AppError('Please verify your email before continuing', ErrorCodes.EMAIL_NOT_VERIFIED, 403);
}
