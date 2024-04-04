const express = require('express');
const getTransporter = require('../utils/getTransporter');
const withEmailTemplate = require('../utils/withEmailTemplate');

const router = express.Router();

router.get('/', async (req, res) => {
  const { from, to, subject, content, isPersonalEmail, replyTo } = await req.json();
  try {
    const transporter = await getTransporter(isPersonalEmail);

    if (!transporter) {
      return;
    }

    const info = await transporter.sendMail({
      from: from || '"Best from ClassroomIO" <best@classroomio.com>', // sender address
      to, // list of receivers
      subject, // Subject line
      replyTo,
      html: withEmailTemplate(content) // html body
    });

    console.log('Message sent: %s', info.messageId);

    return info;
  } catch (error) {
    console.error({ error });

    return error;
  }
  console.log('sendmail');
});
module.exports = router;
