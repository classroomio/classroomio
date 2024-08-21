import { PUBLIC_SERVER_URL } from '$env/static/public';

export async function POST({ request }) {
  try {
    const emailDataArray = await request.json();
    const response = await fetch(`${PUBLIC_SERVER_URL}/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailDataArray)
    });

    const responseData = await response.json();
    console.log('Emails sent successfully:', responseData);
    return new Response(
      JSON.stringify({
        message: 'Emails sent successfully'
      })
    );
  } catch (error) {
    console.error('Error sending emails:', error);
  }
}
