import * as schema from '@db/schema';

import { Session } from 'better-auth';
import { db } from '@db/drizzle';

/**
 * Records one login per user per day in analytics_login_events.
 *
 * Why: powers the org admin "most active login days" chart. The unique
 * constraint on (user_id, logged_in_date) plus onConflictDoNothing keeps
 * the row count at most one per user per calendar day.
 */
export const trackLoginHook = async (session: Pick<Session, 'userId'>) => {
  if (!session?.userId) return;

  try {
    await db
      .insert(schema.analyticsLoginEvents)
      .values({ userId: session.userId })
      .onConflictDoNothing({
        target: [schema.analyticsLoginEvents.userId, schema.analyticsLoginEvents.loggedInDate]
      });
  } catch (error) {
    console.error('trackLoginHook error:', error);
  }
};
