import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import {
  attachLessonBlock,
  createLessonBlock,
  duplicateLessonBlock,
  getLessonBlockHistory,
  getLessonBlocks,
  moveLessonPlacement,
  removeLessonPlacement,
  updateLessonBlock,
  updateLessonBlockLocale,
  updateLessonPlacement
} from '@cio/core/services/block/block';
import { getLesson, updateLessonService } from '@cio/core/services/lesson/lesson';
import { listLessonLanguages, upsertLessonLanguageService } from '@cio/core/services/lesson-language';
import { ErrorCodes } from '@cio/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const slides = {
  src: 'https://docs.google.com/presentation/d/e/abc/embed',
  platform: 'google-slides' as const
};

describe.skipIf(!hasDatabase)('lesson blocks', () => {
  const ids = { org: '', group: '', course: '', lessonA: '', lessonB: '' };

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `blocks-${Date.now()}` }, db);
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Blocks', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Blocks course', description: '', groupId: group.id, slug: `blocks-${organization.id}` })
      .returning();
    const [lessonA, lessonB] = await db
      .insert(schema.lesson)
      .values([
        { courseId: course.id, title: 'A', slug: 'a', order: 1 },
        { courseId: course.id, title: 'B', slug: 'b', order: 2 }
      ])
      .returning();

    Object.assign(ids, {
      org: organization.id,
      group: group.id,
      course: course.id,
      lessonA: lessonA.id,
      lessonB: lessonB.id
    });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db.delete(schema.lesson).where(inArray(schema.lesson.id, [ids.lessonA, ids.lessonB]));
    await db.delete(schema.course).where(eq(schema.course.id, ids.course));
    await db.delete(schema.group).where(eq(schema.group.id, ids.group));
    await db.delete(schema.organization).where(eq(schema.organization.id, ids.org));
  });

  it('keeps blocks in the order they were inserted and moved', async () => {
    const first = await createLessonBlock(ids.lessonA, { type: 'note', data: {}, content: '<p>one</p>' });
    const third = await createLessonBlock(ids.lessonA, { type: 'slides', data: slides });
    const second = await createLessonBlock(ids.lessonA, {
      type: 'video',
      data: { type: 'youtube', link: 'https://youtu.be/a' },
      beforePlacementId: third.placementId
    });

    let blocks = await getLessonBlocks(ids.lessonA);
    expect(blocks.map((block) => block.placementId)).toEqual([
      first.placementId,
      second.placementId,
      third.placementId
    ]);

    await moveLessonPlacement(ids.lessonA, third.placementId, { beforePlacementId: first.placementId });
    blocks = await getLessonBlocks(ids.lessonA);
    expect(blocks.map((block) => block.type)).toEqual(['slides', 'note', 'video']);

    for (const block of blocks) {
      await removeLessonPlacement(ids.lessonA, block.placementId);
    }
    expect(await getLessonBlocks(ids.lessonA)).toEqual([]);
  });

  it('gives concurrent inserts distinct positions', async () => {
    const created = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        createLessonBlock(ids.lessonA, { type: 'video', data: { type: 'youtube', link: `https://youtu.be/${index}` } })
      )
    );

    const positions = new Set(created.map((block) => block.position));
    expect(positions.size).toBe(6);

    for (const block of created) {
      await removeLessonPlacement(ids.lessonA, block.placementId);
    }
  });

  it('shares an attached block across lessons until it is the last use', async () => {
    const original = await createLessonBlock(ids.lessonA, {
      type: 'video',
      data: { type: 'youtube', link: 'https://youtu.be/s' }
    });
    const attached = await attachLessonBlock(ids.lessonB, { blockId: original.id });

    expect(attached.id).toBe(original.id);
    expect(attached.usageCount).toBe(2);

    await updateLessonBlock(ids.lessonA, original.id, {
      data: { type: 'youtube', link: 'https://youtu.be/changed' },
      expectedVersion: original.version
    });
    const [seenFromB] = await getLessonBlocks(ids.lessonB);
    expect(seenFromB.data.link).toBe('https://youtu.be/changed');

    await expect(attachLessonBlock(ids.lessonB, { blockId: original.id })).rejects.toMatchObject({ statusCode: 409 });

    expect(await removeLessonPlacement(ids.lessonA, original.placementId)).toMatchObject({ blockDeleted: false });
    expect(await removeLessonPlacement(ids.lessonB, attached.placementId)).toMatchObject({ blockDeleted: true });
  });

  it('rejects a stale version instead of overwriting', async () => {
    const note = await createLessonBlock(ids.lessonA, { type: 'note', data: {}, content: '<p>v1</p>' });

    const saved = await updateLessonBlockLocale(ids.lessonA, note.id, 'en', {
      content: '<p>v2</p>',
      expectedVersion: note.version
    });
    expect(saved.version).toBe(note.version + 1);
    expect(saved.contents.en).toBe('<p>v2</p>');

    await expect(
      updateLessonBlockLocale(ids.lessonA, note.id, 'en', { content: '<p>stale</p>', expectedVersion: note.version })
    ).rejects.toMatchObject({ code: ErrorCodes.BLOCK_VERSION_CONFLICT, statusCode: 409 });

    const [current] = await getLessonBlocks(ids.lessonA);
    expect(current.contents.en).toBe('<p>v2</p>');

    await removeLessonPlacement(ids.lessonA, note.placementId);
  });

  it('keeps per-lesson settings on the placement, not the block', async () => {
    const original = await createLessonBlock(ids.lessonA, {
      type: 'video',
      data: { type: 'youtube', link: 'https://youtu.be/p' }
    });
    await attachLessonBlock(ids.lessonB, { blockId: original.id });
    const [placedInB] = await getLessonBlocks(ids.lessonB);

    await updateLessonPlacement(ids.lessonB, placedInB.placementId, { required: true, watchThreshold: 80 });

    const [inA] = await getLessonBlocks(ids.lessonA);
    const [inB] = await getLessonBlocks(ids.lessonB);
    expect(inA.required).toBe(false);
    expect(inB).toMatchObject({ required: true, watchThreshold: 80 });

    await removeLessonPlacement(ids.lessonA, inA.placementId);
    await removeLessonPlacement(ids.lessonB, inB.placementId);
  });

  it('detaches a lesson from a shared block when it takes the copy', async () => {
    const original = await createLessonBlock(ids.lessonA, { type: 'note', data: {}, content: '<p>shared</p>' });
    const attached = await attachLessonBlock(ids.lessonB, { blockId: original.id });

    const copy = await duplicateLessonBlock(ids.lessonB, original.id, { replacePlacementId: attached.placementId });
    expect(copy.id).not.toBe(original.id);
    expect(copy.contents.en).toBe('<p>shared</p>');

    await updateLessonBlockLocale(ids.lessonB, copy.id, 'en', {
      content: '<p>edited</p>',
      expectedVersion: copy.version
    });
    const [stillShared] = await getLessonBlocks(ids.lessonA);
    expect(stillShared.contents.en).toBe('<p>shared</p>');
    expect(stillShared.usageCount).toBe(1);

    await removeLessonPlacement(ids.lessonA, original.placementId);
    await removeLessonPlacement(ids.lessonB, copy.placementId);
  });

  it('translates writes to the deprecated lesson fields into blocks', async () => {
    await updateLessonService(ids.lessonA, {
      videos: [
        { type: 'youtube', link: 'https://youtu.be/x', watchEnforced: true },
        { type: 'vimeo', link: 'https://vimeo.com/1' }
      ]
    });

    let lesson = await getLesson(ids.lessonA);
    expect(lesson.blocks.map((block) => block.type)).toEqual(['video', 'video']);
    expect((lesson.videos ?? []).map((video) => video.link)).toEqual(['https://youtu.be/x', 'https://vimeo.com/1']);
    expect(lesson.videos?.[0]?.watchEnforced).toBe(true);

    await updateLessonService(ids.lessonA, { videos: [{ type: 'vimeo', link: 'https://vimeo.com/1' }] });
    lesson = await getLesson(ids.lessonA);
    expect(lesson.blocks).toHaveLength(1);

    await updateLessonService(ids.lessonA, { videos: [] });
    expect((await getLesson(ids.lessonA)).blocks).toEqual([]);
  });

  it('stores lesson translations in the first note block and records their history', async () => {
    await upsertLessonLanguageService(ids.lessonA, { locale: 'en', content: '<p>hello</p>' });
    await upsertLessonLanguageService(ids.lessonA, { locale: 'fr', content: '<p>bonjour</p>' });

    const blocks = await getLessonBlocks(ids.lessonA);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('note');
    expect(blocks[0].contents).toMatchObject({ en: '<p>hello</p>', fr: '<p>bonjour</p>' });

    const languages = await listLessonLanguages(ids.lessonA);
    expect(languages.map((language) => language.locale).sort()).toEqual(['en', 'fr']);

    const history = await getLessonBlockHistory(ids.lessonA, blocks[0].id, 'en', { limit: 5 });
    expect(history.items[0].newContent).toBe('<p>hello</p>');

    await removeLessonPlacement(ids.lessonA, blocks[0].placementId);
  });

  it('removes a lesson block without leaving orphans when the lesson is deleted', async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const { deleteLesson } = await import('@db/queries/lesson');

    const [temporary] = await db
      .insert(schema.lesson)
      .values({ courseId: ids.course, title: 'Temporary', slug: 'temporary', order: 3 })
      .returning();
    const block = await createLessonBlock(temporary.id, { type: 'note', data: {}, content: '<p>x</p>' });

    await deleteLesson(temporary.id);

    const remaining = await db.select().from(schema.block).where(eq(schema.block.id, block.id));
    expect(remaining).toEqual([]);
  });
});
