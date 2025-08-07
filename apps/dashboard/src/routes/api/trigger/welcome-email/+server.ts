import { json } from '@sveltejs/kit';
import { emailTask } from 'trigger/src/trigger/task';

export async function POST({ request }) {
  try {
    const { userId, email, name } = await request.json();

    if (!email || !name) {
      return json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Trigger the welcome email task
    const result = await emailTask.welcomeEmailTask.trigger({
      userId,
      email,
      name
    });

    return json({ success: true, result });
  } catch (error) {
    console.error('Welcome email trigger failed:', error);
    return json({ success: false, message: 'Failed to trigger welcome email' }, { status: 500 });
  }
}
