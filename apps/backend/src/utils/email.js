const { SendMailClient } = require('zeptomail');
const nodemailer = require('nodemailer');

const { ZOHO_TOKEN, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

const zohoClient = new SendMailClient({ url: 'api.zeptomail.eu/', token: ZOHO_TOKEN });

const nodemailerTransporter = async () => {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    console.error('SMTP configuration missing');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
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
