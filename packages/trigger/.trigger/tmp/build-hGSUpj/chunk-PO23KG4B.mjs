import {
  prepareWelcomeEmail,
  sendEmail
} from "./chunk-VERM3UV5.mjs";
import {
  logger,
  task
} from "./chunk-IMKCPWQB.mjs";
import {
  init_esm
} from "./chunk-KJE3LWUS.mjs";

// src/trigger/task/email-tasks/welcome-email.ts
init_esm();
var welcomeEmailTask = task({
  id: "welcome-email",
  maxDuration: 300,
  // 5 minutes
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1e3,
    maxTimeoutInMs: 1e4,
    factor: 2,
    randomize: true
  },
  run: async (payload, { ctx }) => {
    const { userId, email, name } = payload;
    try {
      if (!email || !name) {
        throw new Error("Missing required fields: email or name");
      }
      const emailContent = await prepareWelcomeEmail(name);
      const result = await sendEmail(
        email,
        "Welcome to our platform!",
        emailContent
      );
      logger.log("Welcome email sent successfully", {
        userId,
        email,
        messageId: result.messageId
      });
      return {
        success: true,
        messageId: result.messageId,
        sentAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      logger.error("Failed to send welcome email", {
        userId,
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
});

export {
  welcomeEmailTask
};
//# sourceMappingURL=chunk-PO23KG4B.mjs.map
