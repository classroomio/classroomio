import { json } from '@sveltejs/kit';
import { scheduleTask } from 'trigger/src/trigger/task';

export async function POST({ request }) {
  try {
    const { userId, email, name } = await request.json();
    // Trigger the daily cleanup task
    const result = await scheduleTask.dailyCleanupTask.trigger({
        type: "DECLARATIVE",
        timestamp: new Date(),
        timezone: "UTC",
        scheduleId: "daily-cleanup",
        upcoming: [new Date()],
    });

    return json({ success: true, result });
  } catch (error) {
    console.error('Cleanup trigger failed:', error);
    return json({ success: false, message: 'Failed to trigger cleanup' }, { status: 500 });
  }
}
