const express = require('express');
const zod = require('zod');
const { nodemailerTransporter, zohoClient } = require('../utils/email');
const { withEmailTemplate } = require('../utils/withEmailTemplate');

const emailRouter = express.Router();

let transporter;

nodemailerTransporter().then((t) => {
  transporter = t;
});

async function sendWithNodemailer(emailData) {
  const { from, to, subject, content, isPersonalEmail, replyTo } = emailData;

  if (!transporter) {
    return;
  }

  return await transporter.sendMail({
    from: from || '"Best from ClassroomIO" <best@classroomio.com>',
    to,
    subject,
    replyTo,
    html: withEmailTemplate(content)
  });
}

// format: "ClassroomIO Developers (via ClassroomIO.com)" <notify@mail.classroomio.com>
function extractNameAndEmail(str) {
  // Use regular expressions to match the name and email
  const regex = /"(.*?)"\s+<\s*(.*?)@(.*?)\s*>/;
  const match = str.match(regex);

  if (match) {
    // Extract the name and email from the match groups
    const name = match[1];
    const email = match[2] + '@' + match[3];
    return { name, email };
  } else {
    // Return undefined if the format doesn't match
    return { name: from, email: from };
  }
}

async function sendWithZoho(emailData) {
  const { from, to, subject, content } = emailData;

  const fromData = extractNameAndEmail(from);

  return zohoClient.sendMail({
    from: {
      address: fromData.email,
      name: fromData.name
    },
    to: [
      {
        email_address: {
          address: to
        }
      }
    ],
    subject,
    htmlbody: content
  });
}

emailRouter.post('/', async (req, res) => {
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
        let res;

        try {
          if (emailData.isPersonalEmail || !ZOHO_TOKEN) {
            res = await sendWithNodemailer(emailData);
          } else {
            res = await sendWithZoho(emailData);
          }

          console.log('Email status', res);
        } catch (error) {
          console.error('Error sending email', error, error?.error?.details?.[0]);
        }
      })
    );

    console.log('Email sent');
    return res.json({ success: true });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(400).json({ error: `Bad request - ${error.message}` });
  }
});

module.exports = emailRouter;
