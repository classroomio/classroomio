import * as schema from '@db/schema';
import type { TNewPluginAuditEvent, TPluginAuditEvent } from '@db/types';
import { desc, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function recordPluginAuditEvent(data: TNewPluginAuditEvent): Promise<TPluginAuditEvent> {
  const [row] = await db.insert(schema.pluginAuditEvent).values(data).returning();

  return row;
}

export async function listPluginAuditEvents(installationId: string, limit: number = 50): Promise<TPluginAuditEvent[]> {
  return db
    .select()
    .from(schema.pluginAuditEvent)
    .where(eq(schema.pluginAuditEvent.installationId, installationId))
    .orderBy(desc(schema.pluginAuditEvent.createdAt))
    .limit(limit);
}
