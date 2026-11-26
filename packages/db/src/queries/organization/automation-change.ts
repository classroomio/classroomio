import * as schema from '@db/schema';

import { db } from '@db/drizzle';
import type { TNewAutomationChangeLog } from '@db/types';

export const createAutomationChangeLog = async (data: TNewAutomationChangeLog) => {
  try {
    const [row] = await db.insert(schema.automationChangeLog).values(data).returning();

    if (!row) {
      throw new Error('Failed to record automation change');
    }

    return row;
  } catch (error) {
    console.error('createAutomationChangeLog error:', error);
    throw new Error('Failed to record automation change');
  }
};
