export const sendEmail = async (
  email: string,
  subject: string,
  body: string
): Promise<{ messageId: string }> => {
  console.log(`Sending email to ${email} with subject ${subject} and body ${body}`);
  return { messageId: '123' };
};
export const prepareWelcomeEmail = async (name: string) => {
  return `Welcome ${name} to our platform!`;
};

export const sendReminderEmail = async (user: any) => {
  console.log(`email sent to ${user.email}`);
  return { message: '123' };
};
