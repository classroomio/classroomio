import * as schema from '@db/schema';
import type { TNewPluginAuditEvent, TPluginAuditEvent } from '@db/types';
import { db } from '@db/drizzle';

export async function recordPluginAuditEvent(data: TNewPluginAuditEvent): Promise<TPluginAuditEvent> {
  const [row] = await db.insert(schema.pluginAuditEvent).values(data).returning();

  return row;
}
