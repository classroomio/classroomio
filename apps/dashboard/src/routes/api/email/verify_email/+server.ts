import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';

export async function POST({ fetch, request }) {
  const { to, profileId, orgSiteName, fullname } = await request.json();
  console.log('/POST api/email/verify_email', to, profileId);

  if (!to || !profileId) {
    return json({ success: false, message: 'Name and To are required fields' }, { status: 400 });
  }

  const origin = request.headers.get('origin');
  const verificationData = JSON.stringify({
    profileId,
    orgSiteName
  });

  const verificationLink = `${origin}/api/verify?data=${encodeURIComponent(
    btoa(verificationData)
  )}`;

  const emailData = [
    {
      from: `"Best from ClassroomIO" <notify@mail.classroomio.com>`,
      to,
      subject: 'Action Required: Confirm your email',
      content: `
  <p><strong>Hi ${fullname} 👋</strong></p>
  <p>Welcome to ClassroomIO, new friend! In order to get your account ready for usage, we need to verify your email. </p>
  <p>We do this to make sure we don't get fake user emails in our signup. To get the best out of our product, we'll need you to verify your email by clicking the <strong>Verify</strong> button below
  </p>
  <div>
  <a class="button" href="${verificationLink}">Verify</a>
  </div>
  `
    }
  ];

  await sendEmail(fetch)(emailData);

  return json({
    success: true
  });
}
