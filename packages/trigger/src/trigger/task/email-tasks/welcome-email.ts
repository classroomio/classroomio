// app/trigger/tasks/email/welcome-email.ts
import { logger, task } from '@trigger.dev/sdk/v3';
import { WelcomeEmailPayload } from '../../utils/types';
import { prepareWelcomeEmail, sendEmail } from '../../utils/email';

export const welcomeEmailTask = task({
  id: 'welcome-email',
  maxDuration: 300, // 5 minutes
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
    randomize: true
  },

  run: async (payload: WelcomeEmailPayload, { ctx }) => {
    const { userId, email, name } = payload;

    try {
      // Step 1: Validate input
      if (!email || !name) {
        throw new Error('Missing required fields: email or name');
      }

      // Step 2: Prepare email content
      const emailContent = await prepareWelcomeEmail(name);

      // Step 3: Send email
      const result: { messageId: string } = await sendEmail(
        email,
        'Welcome to our platform!',
        emailContent
      );

      // Step 4: Log success
      logger.log('Welcome email sent successfully', {
        userId,
        email,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      // Step 5: Handle errors
      logger.error('Failed to send welcome email', {
        userId,
        email,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      throw error; // Re-throw for retry mechanism
    }
  }
});
