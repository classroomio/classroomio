const express = require('express');
const zod = require('zod');
const { getTransporter } = require('../utils/getTransporter');
const { withEmailTemplate } = require('../utils/withEmailTemplate');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const mySchema = zod.array(
      zod.object({
        from: zod.string().optional(),
        to: zod.string(),
        subject: zod.string(),
        content: zod.string(),
        isPersonalEmail: zod.boolean().optional(),
        replyTo: zod.string().optional()
      })
    );

    mySchema.parse(req.body);

    const emailDataArray = req.body;

    Promise.all(
      emailDataArray.map(async (emailData) => {
        try {
          const { from, to, subject, content, isPersonalEmail, replyTo } = emailData;

          const transporter = await getTransporter(isPersonalEmail);

          if (!transporter) {
            return;
          }

          const res = await transporter.sendMail({
            from: from || '"Best from ClassroomIO" <best@classroomio.com>',
            to,
            subject,
            replyTo,
            html: withEmailTemplate(content)
          });

          console.log('Email status', res);
        } catch (error) {
          console.error('Error sending email', error);
        }
      })
    );

    console.log('Email sent');
    return res.json({ success: true });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
