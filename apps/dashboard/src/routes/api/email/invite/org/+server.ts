import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';

// API to send invite to students to join an org
export async function POST({ fetch, request }) {
  const body = await request.json();
  const { org, emails } = body;

  console.log('/POST api/email/invite/org', body);

  if (!org || !Object.keys(org).length || !emails || !emails.length) {
    return json({ success: false, message: 'Org data and emails are required' }, { status: 400 });
  }

  const { id, name, siteName } = org;

  const origin = dev ? `http://localhost:5173` : `https://${siteName}.${env.PRIVATE_APP_HOST}`;

  console.log('origin', origin);

  const emailData = emails.map((email: string) => {
    const inviteData = JSON.stringify({
      email,
      orgId: id,
      orgSiteName: siteName
    });
    const inviteLink = `${origin}/invite/s/org/${encodeURIComponent(btoa(inviteData))}`;
    console.log('inviteData', inviteData);

    return {
      from: `"ClassroomIO" <notify@classroomio.com>`,
      to: email,
      subject: `Join ${name} on ClassroomIO 😃`,
      content: `<p>Hey there,</p>
      <p> You have been invited to join ${name} on ClassroomIO 🎉🎉🎉.</p>
      <div>
        <a class="button" href="${inviteLink}">Accept Invitation</a>
      </div>
    `
    };
  });

  await sendEmail(fetch)(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
