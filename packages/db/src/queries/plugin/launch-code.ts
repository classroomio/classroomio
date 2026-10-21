import * as schema from '@db/schema';
import type { TNewPluginLaunchCode, TPluginLaunchCode } from '@db/types';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function createLaunchCode(data: TNewPluginLaunchCode): Promise<TPluginLaunchCode> {
  const [row] = await db.insert(schema.pluginLaunchCode).values(data).returning();

  return row;
}

export async function consumeLaunchCode(codeHash: string): Promise<TPluginLaunchCode | null> {
  const now = new Date().toISOString();

  // Atomically check validity (not expired and not already used) and mark used
  const [row] = await db
    .update(schema.pluginLaunchCode)
    .set({ usedAt: now })
    .where(
      and(
        eq(schema.pluginLaunchCode.codeHash, codeHash),
        isNull(schema.pluginLaunchCode.usedAt),
        gt(schema.pluginLaunchCode.expiresAt, now)
      )
    )
    .returning();

  return row ?? null;
}
