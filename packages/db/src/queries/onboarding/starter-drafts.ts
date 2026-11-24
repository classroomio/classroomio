import * as schema from '@db/schema';

import { and, eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourseImportDraft, TNewCourseImportDraft } from '@db/types';
import type { TStarterCourseSlot } from '@cio/utils/constants/onboarding';

const JOB_ID_PATH = sql`${schema.courseImportDraft.summary} -> 'onboarding' ->> 'jobId'`;
const SLOT_PATH = sql`${schema.courseImportDraft.summary} -> 'onboarding' ->> 'slot'`;

export async function listStarterDrafts(
  organizationId: string,
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseImportDraft)
      .where(and(eq(schema.courseImportDraft.organizationId, organizationId), sql`${JOB_ID_PATH} = ${jobId}`))
      .orderBy(schema.courseImportDraft.createdAt);
  } catch (error) {
    console.error('listStarterDrafts error:', error);
    throw new Error('Failed to list starter drafts');
  }
}

export async function getStarterDraftBySlot(
  organizationId: string,
  jobId: string,
  slot: TStarterCourseSlot,
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft | null> {
  try {
    const [draft] = await dbClient
      .select()
      .from(schema.courseImportDraft)
      .where(
        and(
          eq(schema.courseImportDraft.organizationId, organizationId),
          sql`${JOB_ID_PATH} = ${jobId}`,
          sql`${SLOT_PATH} = ${slot}`
        )
      )
      .limit(1);

    return draft ?? null;
  } catch (error) {
    console.error('getStarterDraftBySlot error:', error);
    throw new Error('Failed to fetch starter draft');
  }
}

/**
 * Inserts a starter draft. The idempotency key (`onboarding:{jobId}:{slot}`) makes a retried job write each slot once.
 */
export async function createStarterDraft(
  values: TNewCourseImportDraft,
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft> {
  try {
    const [created] = await dbClient.insert(schema.courseImportDraft).values(values).onConflictDoNothing().returning();
    if (created) return created;

    if (!values.idempotencyKey) throw new Error('Failed to create starter draft');

    const [existing] = await dbClient
      .select()
      .from(schema.courseImportDraft)
      .where(
        and(
          eq(schema.courseImportDraft.organizationId, values.organizationId),
          eq(schema.courseImportDraft.idempotencyKey, values.idempotencyKey)
        )
      )
      .limit(1);

    if (!existing) throw new Error('Failed to create starter draft');

    return existing;
  } catch (error) {
    console.error('createStarterDraft error:', error);
    throw new Error('Failed to create starter draft');
  }
}

export async function renameStarterDraft(
  organizationId: string,
  draftId: string,
  title: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft | null> {
  try {
    const [draft] = await dbClient
      .update(schema.courseImportDraft)
      .set({
        title,
        draft: sql`jsonb_set(${schema.courseImportDraft.draft}, '{course,title}', to_jsonb(${title}::text))`,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.courseImportDraft.organizationId, organizationId), eq(schema.courseImportDraft.id, draftId)))
      .returning();

    return draft ?? null;
  } catch (error) {
    console.error('renameStarterDraft error:', error);
    throw new Error('Failed to rename starter draft');
  }
}

/**
 * Archives or restores a draft that has not become a course yet. Published drafts are left untouched.
 */
export async function setStarterDraftArchived(
  organizationId: string,
  draftId: string,
  archived: boolean,
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft | null> {
  try {
    const [draft] = await dbClient
      .update(schema.courseImportDraft)
      .set({ status: archived ? 'ARCHIVED' : 'DRAFT', updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.courseImportDraft.organizationId, organizationId),
          eq(schema.courseImportDraft.id, draftId),
          sql`${schema.courseImportDraft.status} <> 'PUBLISHED'`
        )
      )
      .returning();

    return draft ?? null;
  } catch (error) {
    console.error('setStarterDraftArchived error:', error);
    throw new Error('Failed to update starter draft');
  }
}

export async function archiveUnpublishedStarterDrafts(
  organizationId: string,
  jobId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const archived = await dbClient
      .update(schema.courseImportDraft)
      .set({ status: 'ARCHIVED', updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.courseImportDraft.organizationId, organizationId),
          sql`${JOB_ID_PATH} = ${jobId}`,
          eq(schema.courseImportDraft.status, 'DRAFT')
        )
      )
      .returning({ id: schema.courseImportDraft.id });

    return archived.length;
  } catch (error) {
    console.error('archiveUnpublishedStarterDrafts error:', error);
    throw new Error('Failed to archive starter drafts');
  }
}

export async function markStarterDraftPublished(
  draftId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.courseImportDraft)
      .set({ status: 'PUBLISHED', publishedCourseId: courseId, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseImportDraft.id, draftId));
  } catch (error) {
    console.error('markStarterDraftPublished error:', error);
    throw new Error('Failed to mark starter draft published');
  }
}

/**
 * Replaces a starter draft's title and payload, for example after the product name changed.
 */
export async function replaceStarterDraftContent(
  organizationId: string,
  draftId: string,
  content: { title: string; draft: TCourseImportDraft['draft'] },
  dbClient: DbOrTxClient = db
): Promise<TCourseImportDraft | null> {
  try {
    const [draft] = await dbClient
      .update(schema.courseImportDraft)
      .set({ title: content.title, draft: content.draft, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.courseImportDraft.organizationId, organizationId), eq(schema.courseImportDraft.id, draftId)))
      .returning();

    return draft ?? null;
  } catch (error) {
    console.error('replaceStarterDraftContent error:', error);
    throw new Error('Failed to update starter draft');
  }
}
