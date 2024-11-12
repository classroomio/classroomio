import { PUBLIC_SERVER_URL } from '$env/static/public';

const sendEmail = async (subject: string, content: string, replyTo?: string) => {
  try {
    const response = await fetch(`${PUBLIC_SERVER_URL}/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          to: 'digdippa@gmail.com',
          subject,
          content,
          replyTo
        }
      ])
    });

    const responseData = await response.json();
    console.log('Emails sent successfully:', responseData);

    return 'sent';
  } catch (error) {
    console.error('Error sending email', error);
    return 'failed';
  }
};

export async function POST({ request }) {
  try {
    const { title, description, replyTo } = await request.json();
    console.log(title, description, replyTo);
    const result = await sendEmail(title, description, replyTo);

    return new Response(
      JSON.stringify({
        message: 'Issue created successfully',
        issue: result
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.log('errors from backend', error);

    return new Response(
      JSON.stringify({
        message: 'Failed to create issue',
        error: (error as Error)?.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
