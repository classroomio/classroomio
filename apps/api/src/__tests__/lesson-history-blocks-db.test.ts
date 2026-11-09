import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import {
  attachLessonBlock,
  createLessonBlock,
  getLessonBlocks,
  restoreLessonBlockVersion,
  updateLessonBlockLocale
} from '@cio/core/services/block/block';
import { getLessonHistoryService } from '@cio/core/services/lesson/lesson';
import { ErrorCodes } from '@cio/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('lesson history across blocks', () => {
  const ids = { org: '', group: '', course: '', lessons: [] as string[] };

  async function createLesson(title: string): Promise<string> {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [lesson] = await db
      .insert(schema.lesson)
      .values({ courseId: ids.course, title, slug: `${title}-${Date.now()}`, order: ids.lessons.length + 1 })
      .returning();
    ids.lessons.push(lesson.id);

    return lesson.id;
  }

  async function saveCheckpoint(lessonId: string, blockId: string, content: string) {
    const [block] = (await getLessonBlocks(lessonId)).filter((candidate) => candidate.id === blockId);

    return updateLessonBlockLocale(lessonId, blockId, 'en', {
      content,
      expectedVersion: block.version,
      versionIntent: 'manual'
    });
  }

  async function createTwoNoteLesson() {
    const lessonId = await createLesson('two-notes');
    const first = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>A1</p>' });
    await createLessonBlock(lessonId, {
      type: 'video',
      data: { type: 'youtube', link: 'https://youtu.be/abc' }
    });
    const second = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>B1</p>' });
    await saveCheckpoint(lessonId, first.id, '<p>A2</p>');
    await saveCheckpoint(lessonId, second.id, '<p>B2</p>');

    return { lessonId, first, second };
  }

  async function contentOf(lessonId: string, blockId: string) {
    const blocks = await getLessonBlocks(lessonId);

    return blocks.find((block) => block.id === blockId)?.contents.en ?? null;
  }

  async function versionWithContent(lessonId: string, blockId: string, content: string) {
    const history = await getLessonHistoryService(lessonId, 'en', 50);
    const version = history.items.find((item) => item.blockId === blockId && item.newContent === content);
    if (!version?.id) throw new Error(`No version of ${blockId} with ${content}`);

    return version;
  }

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `history-blocks-${Date.now()}` }, db);
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'History blocks', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'History', description: '', groupId: group.id, slug: `history-${organization.id}` })
      .returning();

    Object.assign(ids, { org: organization.id, group: group.id, course: course.id });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    if (ids.lessons.length > 0) {
      await db.delete(schema.lesson).where(inArray(schema.lesson.id, ids.lessons));
    }
    await db.delete(schema.course).where(eq(schema.course.id, ids.course));
    await db.delete(schema.group).where(eq(schema.group.id, ids.group));
    await db.delete(schema.organization).where(eq(schema.organization.id, ids.org));
  });

  it('lists the history of every text block, labelled with its position', async () => {
    const { lessonId, first, second } = await createTwoNoteLesson();

    const history = await getLessonHistoryService(lessonId, 'en', 50);

    const firstEntries = history.items.filter((item) => item.blockId === first.id);
    const secondEntries = history.items.filter((item) => item.blockId === second.id);
    expect(firstEntries.map((item) => item.newContent)).toEqual(['<p>A2</p>', '<p>A1</p>']);
    expect(secondEntries.map((item) => item.newContent)).toEqual(['<p>B2</p>', '<p>B1</p>']);
    expect(firstEntries[0]).toMatchObject({ blockNumber: 1, blockCount: 2, sharedWithOtherLessons: 0 });
    expect(secondEntries[0]).toMatchObject({ blockNumber: 2, blockCount: 2 });
  });

  it('pages through the merged history without repeating entries', async () => {
    const { lessonId, first, second } = await createTwoNoteLesson();

    const textVersionIds = new Set<string>();
    let cursor: string | undefined;
    let pages = 0;

    while (pages < 20) {
      const page = await getLessonHistoryService(lessonId, 'en', 2, cursor);
      for (const item of page.items.filter((entry) => entry.entryType === 'text')) {
        textVersionIds.add(`${item.blockId}:${item.newContent ?? ''}`);
      }
      cursor = page.nextCursor ?? undefined;
      pages += 1;

      if (!cursor) break;
    }

    expect(textVersionIds).toEqual(
      new Set([`${first.id}:<p>A2</p>`, `${first.id}:<p>A1</p>`, `${second.id}:<p>B2</p>`, `${second.id}:<p>B1</p>`])
    );
  });

  it('restores only the block the version belongs to', async () => {
    const { lessonId, first, second } = await createTwoNoteLesson();
    const version = await versionWithContent(lessonId, first.id, '<p>A1</p>');

    const restored = await restoreLessonBlockVersion(lessonId, {
      blockId: first.id,
      locale: 'en',
      versionId: version.id!
    });

    expect(restored).toEqual({ blockId: first.id, detachedFromBlockId: null });
    expect(await contentOf(lessonId, first.id)).toBe('<p>A1</p>');
    expect(await contentOf(lessonId, second.id)).toBe('<p>B2</p>');
  });

  it('gives this lesson its own copy when restoring a shared block', async () => {
    const { lessonId, first } = await createTwoNoteLesson();
    const otherLesson = await createLesson('shares-first');
    await attachLessonBlock(otherLesson, { blockId: first.id });
    const version = await versionWithContent(lessonId, first.id, '<p>A1</p>');

    const restored = await restoreLessonBlockVersion(lessonId, {
      blockId: first.id,
      locale: 'en',
      versionId: version.id!
    });

    expect(restored.detachedFromBlockId).toBe(first.id);
    expect(restored.blockId).not.toBe(first.id);
    expect(await contentOf(lessonId, restored.blockId)).toBe('<p>A1</p>');
    expect(await contentOf(otherLesson, first.id)).toBe('<p>A2</p>');
  });

  it('rejects a version that belongs to a different block', async () => {
    const { lessonId, first, second } = await createTwoNoteLesson();
    const otherBlockVersion = await versionWithContent(lessonId, second.id, '<p>B1</p>');

    await expect(
      restoreLessonBlockVersion(lessonId, { blockId: first.id, locale: 'en', versionId: otherBlockVersion.id! })
    ).rejects.toMatchObject({ code: ErrorCodes.NOT_FOUND });
  });
});
