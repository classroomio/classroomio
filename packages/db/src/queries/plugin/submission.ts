import * as schema from '@db/schema';
import type { TNewPluginSubmission, TPluginSubmission, TPluginSubmissionStatus } from '@db/types';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function createPluginSubmission(data: TNewPluginSubmission): Promise<TPluginSubmission> {
  const [row] = await db.insert(schema.pluginSubmission).values(data).returning();

  return row;
}

export async function getPluginSubmissionById(id: string): Promise<TPluginSubmission | null> {
  const [row] = await db.select().from(schema.pluginSubmission).where(eq(schema.pluginSubmission.id, id)).limit(1);

  return row ?? null;
}

export async function getApprovedPrivatePluginSubmission(
  pluginId: string,
  version: string,
  organizationId: string
): Promise<TPluginSubmission | null> {
  const [row] = await db
    .select()
    .from(schema.pluginSubmission)
    .where(
      and(
        eq(schema.pluginSubmission.pluginId, pluginId),
        eq(schema.pluginSubmission.version, version),
        eq(schema.pluginSubmission.organizationId, organizationId),
        eq(schema.pluginSubmission.releaseLane, 'private'),
        eq(schema.pluginSubmission.status, 'approved')
      )
    )
    .limit(1);

  return row ?? null;
}

export async function listPluginSubmissions(
  options: {
    pluginId?: string;
    organizationId?: string;
    status?: TPluginSubmissionStatus;
  } = {}
): Promise<TPluginSubmission[]> {
  const conditions = [];

  if (options.pluginId) {
    conditions.push(eq(schema.pluginSubmission.pluginId, options.pluginId));
  }
  if (options.organizationId) {
    conditions.push(eq(schema.pluginSubmission.organizationId, options.organizationId));
  }
  if (options.status) {
    conditions.push(eq(schema.pluginSubmission.status, options.status));
  }

  const query = db.select().from(schema.pluginSubmission);

  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(schema.pluginSubmission.createdAt));
  }

  return query.orderBy(desc(schema.pluginSubmission.createdAt));
}

export async function updatePluginSubmissionStatus(
  id: string,
  status: TPluginSubmissionStatus,
  reviewNotes?: string | null
): Promise<TPluginSubmission | null> {
  const setValues: Partial<TNewPluginSubmission> = {
    status,
    updatedAt: new Date().toISOString()
  };

  if (reviewNotes !== undefined) {
    setValues.reviewNotes = reviewNotes;
  }

  const [row] = await db
    .update(schema.pluginSubmission)
    .set(setValues)
    .where(eq(schema.pluginSubmission.id, id))
    .returning();

  return row ?? null;
}
