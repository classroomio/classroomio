import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';

// API to send invite to students to access any product.
export async function POST({ fetch, request }) {
  const body = await request.json();
  const { org, invites } = body;

  console.log('/POST api/email/invite/product', body);

  if (!org || !Object.keys(org).length || !invites || !invites.length) {
    return json({ success: false, message: 'Org data and invites are required' }, { status: 400 });
  }

  const { name, siteName } = org;

  const origin = dev ? `http://localhost:5173` : `https://${siteName}.${env.PRIVATE_APP_HOST}`;

  console.log('origin', origin);

  const emailData = invites.map((invite: { id: string; email: string; products: string[] }) => {
    const inviteLink = `${origin}/invite/p/${invite.id}`;
    const productsCount = invite.products.length;

    return {
      from: `"ClassroomIO" <notify@classroomio.com>`,
      to: invite.email,
      subject: `You now have access to ${productsCount} ${productsCount === 1 ? 'product' : 'products'} on ${name}`,
      content: `<p>Hey there,</p>
      <p> Congratulations! You have been given access the following products on ${name}</p>
      <ul>
        ${invite.products
          .map(
            (product: string) => `
          <li style="text-transform: capitalize">${product}</li>
        `
          )
          .join('')}
      </ul>
      <div>
        <a class="button" href="${inviteLink}">Access Products</a>
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
