import {
  init_esm
} from "./chunk-KJE3LWUS.mjs";

// src/trigger/utils/email.ts
init_esm();
var sendEmail = async (email, subject, body) => {
  console.log(`Sending email to ${email} with subject ${subject} and body ${body}`);
  return { messageId: "123" };
};
var prepareWelcomeEmail = async (name) => {
  return `Welcome ${name} to our platform!`;
};
var sendReminderEmail = async (user) => {
  console.log(`email sent to ${user.email}`);
  return { message: "123" };
};

export {
  sendEmail,
  prepareWelcomeEmail,
  sendReminderEmail
};
//# sourceMappingURL=chunk-VERM3UV5.mjs.map
