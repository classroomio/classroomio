const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_USER_NOTIFY, SMTP_PASSWORD_NOTIFY } =
  process.env;

const getTransporter = async (isPersonal = false) => {
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
      port: parseInt(SMTP_PORT || '465'),
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

module.exports = { getTransporter };
