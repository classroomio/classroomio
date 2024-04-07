const express = require('express');
const { getTransporter } = require('../utils/getTransporter');
const { withEmailTemplate } = require('../utils/withEmailTemplate');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const emailDataArray = req.body;

    const emailInfoArray = [];

    for (const emailData of emailDataArray) {
      const { from, to, subject, content, isPersonalEmail, replyTo } = emailData;

      const transporter = await getTransporter(isPersonalEmail);

      if (!transporter) {
        continue;
      }

      const info = await transporter.sendMail({
        from: from || '"Best from ClassroomIO" <best@classroomio.com>',
        to,
        subject,
        replyTo,
        html: withEmailTemplate(content)
      });

      console.log('Message sent: %s', info.messageId);
      emailInfoArray.push(info);
    }

    console.log('sendmail');
    return res.json({ info: emailInfoArray });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
