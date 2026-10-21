import * as schema from '@db/schema';
import type { TNewPluginPublisher, TPluginPublisher } from '@db/types';
import { eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getPublisherById(publisherId: string): Promise<TPluginPublisher | null> {
  const [row] = await db
    .select()
    .from(schema.pluginPublisher)
    .where(eq(schema.pluginPublisher.id, publisherId))
    .limit(1);

  return row ?? null;
}

export async function listPublishers(): Promise<TPluginPublisher[]> {
  return db.select().from(schema.pluginPublisher).orderBy(schema.pluginPublisher.name);
}

export async function upsertPublisher(data: TNewPluginPublisher): Promise<TPluginPublisher> {
  const [row] = await db
    .insert(schema.pluginPublisher)
    .values(data)
    .onConflictDoUpdate({
      target: schema.pluginPublisher.id,
      set: {
        name: data.name,
        publisherClass: data.publisherClass,
        verified: data.verified,
        domain: data.domain,
        securityContact: data.securityContact,
        supportContact: data.supportContact,
        status: data.status,
        updatedAt: new Date().toISOString()
      }
    })
    .returning();

  return row;
}
