const { SendMailClient } = require('zeptomail');
const nodemailer = require('nodemailer');

const {
  ZOHO_TOKEN,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_USER_NOTIFY,
  SMTP_PASSWORD_NOTIFY
} = process.env;

console.log({ ZOHO_TOKEN });

const zohoClient = new SendMailClient({ url: 'api.zeptomail.eu/', token: ZOHO_TOKEN });

const nodemailerTransporter = async (isPersonal = false) => {
  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_USER_NOTIFY ||
    !SMTP_PASSWORD_NOTIFY
  ) {
    console.error('SMTP configuration missing');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: isPersonal ? SMTP_USER : SMTP_USER_NOTIFY,
        pass: isPersonal ? SMTP_PASSWORD : SMTP_PASSWORD_NOTIFY
      }
    });
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error('Transporter error:', error);
    return null;
  }
};

module.exports = { nodemailerTransporter, zohoClient };
