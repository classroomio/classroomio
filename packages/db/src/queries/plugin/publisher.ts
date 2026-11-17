import * as schema from '@db/schema';
import type { TPluginPublisher } from '@db/types';
import { db } from '@db/drizzle';

export async function listPublishers(): Promise<TPluginPublisher[]> {
  return db.select().from(schema.pluginPublisher).orderBy(schema.pluginPublisher.name);
}
