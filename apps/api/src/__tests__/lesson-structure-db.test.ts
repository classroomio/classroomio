import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import {
  attachLessonBlock,
  createLessonBlock,
  getLessonBlocks,
  listBlockLibrary,
  moveLessonPlacement,
  removeLessonPlacement,
  updateLessonBlock,
  updateLessonBlockLocale
} from '@cio/core/services/block/block';
import { applyLegacyLessonContent } from '@cio/core/services/block/legacy-content';
import { restoreLessonToEntry, undoLessonChangeSet } from '@cio/core/services/block/lesson-structure';
import { getLessonHistoryService } from '@cio/core/services/lesson/lesson';
import { upsertLessonLanguageService } from '@cio/core/services/lesson-language';
import { ErrorCodes } from '@cio/utils/errors';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const youtube = (link: string) => ({ type: 'youtube' as const, link });

describe.skipIf(!hasDatabase)('lesson structure history', () => {
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

  async function writeText(
    lessonId: string,
    blockId: string,
    content: string,
    actor: Parameters<typeof updateLessonBlockLocale>[4] = {}
  ) {
    const block = (await getLessonBlocks(lessonId)).find((candidate) => candidate.id === blockId);
    if (!block) throw new Error(`Block ${blockId} is not in lesson ${lessonId}`);

    return updateLessonBlockLocale(
      lessonId,
      blockId,
      'en',
      { content, expectedVersion: block.version, versionIntent: 'manual' },
      actor
    );
  }

  async function contentsOf(lessonId: string): Promise<string[]> {
    return (await getLessonBlocks(lessonId)).map((block) => block.contents.en ?? '');
  }

  async function historyOf(lessonId: string) {
    return (await getLessonHistoryService(lessonId, 'en', 50)).items;
  }

  function assistant(changeSetId: string) {
    return { actorProfileId: null, source: 'assistant' as const, changeSetId };
  }

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const schema = await import('@db/schema');

    const organization = await createOrganization({ name: `structure-${Date.now()}` }, db);
    const [group] = await db
      .insert(schema.group)
      .values({ name: 'Structure', organizationId: organization.id })
      .returning();
    const [course] = await db
      .insert(schema.course)
      .values({ title: 'Structure', description: '', groupId: group.id, slug: `structure-${organization.id}` })
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

  it('soft-deletes a removed block for the retention window and keeps its history', async () => {
    const lessonId = await createLesson('soft-delete');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>note</p>' });

    const removed = await removeLessonPlacement(lessonId, note.placementId);

    expect(removed.blockDeleted).toBe(true);
    const library = await listBlockLibrary(ids.org, { page: 1, limit: 50 });
    expect(library.items.find((item) => item.id === note.id)).toBeUndefined();

    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [blockRow] = await db.select().from(schema.block).where(eq(schema.block.id, note.id));
    expect(blockRow?.deletedAt).not.toBeNull();
  });

  it('restores a removed block with its text and removes blocks added later', async () => {
    const lessonId = await createLesson('restore-structure');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>old</p>' });
    const video = await createLessonBlock(lessonId, { type: 'video', data: youtube('https://youtu.be/restore') });
    const restorePoint = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === video.id)
    );
    if (!restorePoint) throw new Error('No revision recorded for the video');

    await removeLessonPlacement(lessonId, note.placementId);
    const laterNote = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>new</p>' });

    const restored = await restoreLessonToEntry(
      lessonId,
      { entryType: 'structure', entryId: restorePoint.id },
      { authorId: null }
    );

    expect(restored).toMatchObject({ placementsAdded: 1, placementsRemoved: 1, blocksReattached: 1 });
    const blockIds = (await getLessonBlocks(lessonId)).map((block) => block.id);
    expect(blockIds).toEqual([note.id, video.id]);
    expect(blockIds).not.toContain(laterNote.id);
    expect(await contentsOf(lessonId)).toEqual(['<p>old</p>', '']);
  });

  it('restores the whole lesson to the moment of a text entry', async () => {
    const lessonId = await createLesson('restore-text-entry');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>v1</p>' });
    await writeText(lessonId, note.id, '<p>v2</p>');
    const v2Entry = (await historyOf(lessonId)).find((item) => item.newContent === '<p>v2</p>');
    await writeText(lessonId, note.id, '<p>v3</p>');
    await createLessonBlock(lessonId, { type: 'video', data: youtube('https://youtu.be/later') });

    await restoreLessonToEntry(lessonId, { entryType: 'text', entryId: v2Entry!.id }, { authorId: null });

    expect(await contentsOf(lessonId)).toEqual(['<p>v2</p>']);
  });

  it('keeps current text when no saved version is old enough instead of blanking it', async () => {
    const lessonId = await createLesson('restore-pruned');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>kept</p>' });
    const video = await createLessonBlock(lessonId, { type: 'video', data: youtube('https://youtu.be/pruned') });
    const restorePoint = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === video.id)
    );
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const locales = await db.select().from(schema.blockLocale).where(eq(schema.blockLocale.blockId, note.id));
    await db.delete(schema.blockLocaleHistory).where(eq(schema.blockLocaleHistory.blockLocaleId, locales[0].id));

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: restorePoint!.id }, { authorId: null });

    expect(await contentsOf(lessonId)).toEqual(['<p>kept</p>', '']);
  });

  it('gives the lesson its own copy when another lesson now uses the block', async () => {
    const lessonId = await createLesson('restore-copy');
    const shared = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>shared</p>' });
    const restorePoint = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === shared.id)
    );
    await writeText(lessonId, shared.id, '<p>edited later</p>');
    const otherLesson = await createLesson('restore-copy-sibling');
    await attachLessonBlock(otherLesson, { blockId: shared.id });

    const restored = await restoreLessonToEntry(
      lessonId,
      { entryType: 'structure', entryId: restorePoint!.id },
      { authorId: null }
    );

    expect(restored.blocksCopied).toBe(1);
    expect(await contentsOf(lessonId)).toEqual(['<p>shared</p>']);
    expect(await contentsOf(otherLesson)).toEqual(['<p>edited later</p>']);
  });

  it('copies a shared media block instead of changing its settings in other lessons', async () => {
    const lessonId = await createLesson('restore-media-copy');
    const image = await createLessonBlock(lessonId, {
      type: 'image',
      data: { url: 'https://example.com/a.png', alt: 'Before' }
    });
    const otherLesson = await createLesson('restore-media-sibling');
    await attachLessonBlock(otherLesson, { blockId: image.id });
    const restorePoint = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === image.id)
    );
    await updateLessonBlock(lessonId, image.id, {
      data: { url: 'https://example.com/a.png', alt: 'After' },
      expectedVersion: image.version
    });

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: restorePoint!.id }, { authorId: null });

    const [restoredImage] = await getLessonBlocks(lessonId);
    const [siblingImage] = await getLessonBlocks(otherLesson);
    expect(restoredImage.data).toMatchObject({ alt: 'Before' });
    expect(restoredImage.id).not.toBe(image.id);
    expect(siblingImage).toMatchObject({ id: image.id, data: { alt: 'After' } });
  });

  it('restores block positions that later moves swapped', async () => {
    const lessonId = await createLesson('restore-swap');
    const first = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>one</p>' });
    const second = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>two</p>' });
    const restorePoint = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === second.id)
    );
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [firstPlacement, secondPlacement] = [first, second].map((block) => block.placementId);
    await db.transaction(async (tx) => {
      await tx
        .update(schema.blockPlacement)
        .set({ position: 'swap' })
        .where(eq(schema.blockPlacement.id, firstPlacement));
      await tx
        .update(schema.blockPlacement)
        .set({ position: first.position })
        .where(eq(schema.blockPlacement.id, secondPlacement));
      await tx
        .update(schema.blockPlacement)
        .set({ position: second.position })
        .where(eq(schema.blockPlacement.id, firstPlacement));
    });

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: restorePoint!.id }, { authorId: null });

    expect(await contentsOf(lessonId)).toEqual(['<p>one</p>', '<p>two</p>']);
  });

  it('undoes a text-only assistant edit', async () => {
    const lessonId = await createLesson('undo-text');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>Original</p>' });
    const changeSetId = crypto.randomUUID();
    await writeText(lessonId, note.id, '<p>AI rewrite</p>', assistant(changeSetId));

    const undone = await undoLessonChangeSet({ lessonId, changeSetId, authorId: null });

    expect(undone.textBlocksChanged).toBe(1);
    expect(await contentsOf(lessonId)).toEqual(['<p>Original</p>']);
  });

  it('undoes an assistant change without touching later edits to other blocks', async () => {
    const lessonId = await createLesson('undo-keeps-others');
    const teacherNote = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>Teacher v1</p>' });
    const changeSetId = crypto.randomUUID();
    await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>AI note</p>' }, assistant(changeSetId));
    await writeText(lessonId, teacherNote.id, '<p>Teacher v2</p>');

    await undoLessonChangeSet({ lessonId, changeSetId, authorId: null });

    expect(await contentsOf(lessonId)).toEqual(['<p>Teacher v2</p>']);
  });

  it('refuses to undo when a later edit changed the same block', async () => {
    const lessonId = await createLesson('undo-conflict');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>Original</p>' });
    const changeSetId = crypto.randomUUID();
    await writeText(lessonId, note.id, '<p>AI rewrite</p>', assistant(changeSetId));
    await writeText(lessonId, note.id, '<p>Teacher fix</p>');

    await expect(undoLessonChangeSet({ lessonId, changeSetId, authorId: null })).rejects.toMatchObject({
      code: ErrorCodes.CONFLICT
    });
    expect(await contentsOf(lessonId)).toEqual(['<p>Teacher fix</p>']);
  });

  it('undoes a batch of structure and text, then refuses to undo it twice', async () => {
    const lessonId = await createLesson('undo-batch');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>before</p>' });
    const changeSetId = crypto.randomUUID();
    await createLessonBlock(
      lessonId,
      { type: 'video', data: youtube('https://youtu.be/undo') },
      assistant(changeSetId)
    );
    await writeText(lessonId, note.id, '<p>after rewrite</p>', assistant(changeSetId));

    const undone = await undoLessonChangeSet({ lessonId, changeSetId, authorId: null });

    expect(undone.placementsRemoved).toBe(1);
    expect(await contentsOf(lessonId)).toEqual(['<p>before</p>']);
    await expect(undoLessonChangeSet({ lessonId, changeSetId, authorId: null })).rejects.toMatchObject({
      code: ErrorCodes.CONFLICT
    });
  });

  it('can undo the first change ever made to a lesson', async () => {
    const lessonId = await createLesson('undo-first');
    const changeSetId = crypto.randomUUID();
    await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>AI first</p>' }, assistant(changeSetId));

    await undoLessonChangeSet({ lessonId, changeSetId, authorId: null });

    expect(await getLessonBlocks(lessonId)).toEqual([]);
  });

  it('records media setting changes so they show in history and can be undone', async () => {
    const lessonId = await createLesson('undo-media');
    const image = await createLessonBlock(lessonId, {
      type: 'image',
      data: { url: 'https://example.com/b.png', alt: 'Original alt' }
    });
    const changeSetId = crypto.randomUUID();
    await updateLessonBlock(
      lessonId,
      image.id,
      { data: { url: 'https://example.com/b.png', alt: 'AI alt' }, expectedVersion: image.version },
      assistant(changeSetId)
    );

    const edited = (await historyOf(lessonId)).find((item) => item.changeSetId === changeSetId);
    expect(edited?.changes).toEqual([expect.objectContaining({ kind: 'edited', blockId: image.id })]);

    await undoLessonChangeSet({ lessonId, changeSetId, authorId: null });

    expect((await getLessonBlocks(lessonId))[0].data).toMatchObject({ alt: 'Original alt' });
  });

  it('keeps the history of a removed text block and returns one entry shape', async () => {
    const lessonId = await createLesson('history-removed');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>gone</p>' });
    await removeLessonPlacement(lessonId, note.placementId);

    const history = await historyOf(lessonId);
    const textEntry = history.find((item) => item.entryType === 'text' && item.blockId === note.id);
    const structureEntry = history.find((item) => item.entryType === 'structure');

    expect(textEntry).toMatchObject({ blockRemoved: true, blockNumber: null, newContent: '<p>gone</p>' });
    expect(Object.keys(textEntry!).sort()).toEqual(Object.keys(structureEntry!).sort());
  });

  it('records the lesson order for moves on the structure timeline', async () => {
    const lessonId = await createLesson('move-order');
    const first = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>one</p>' });
    const second = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>two</p>' });

    await moveLessonPlacement(
      lessonId,
      first.placementId,
      { afterPlacementId: second.placementId },
      assistant(crypto.randomUUID())
    );

    expect(await contentsOf(lessonId)).toEqual(['<p>two</p>', '<p>one</p>']);
    const moveEntry = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'moved')
    );
    expect(moveEntry?.changes).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'moved', blockId: first.id })])
    );
  });

  it('restores the starting point to the layout before the first recorded change', async () => {
    const lessonId = await createLesson('restore-baseline');
    await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>first</p>' });
    const startingPoint = (await historyOf(lessonId)).find(
      (item) => item.entryType === 'structure' && item.changes.length === 0
    );
    if (!startingPoint) throw new Error('No starting point recorded');

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: startingPoint.id }, { authorId: null });

    expect(await getLessonBlocks(lessonId)).toEqual([]);
  });

  it('records lesson settings changes to video blocks so a restore does not silently revert them', async () => {
    const lessonId = await createLesson('legacy-settings');
    const video = { type: 'youtube' as const, link: 'https://youtu.be/legacy' };
    await applyLegacyLessonContent(lessonId, { videos: [{ ...video, watchEnforced: false }] });
    await applyLegacyLessonContent(lessonId, { videos: [{ ...video, watchEnforced: true }] });

    const history = await historyOf(lessonId);
    const enforced = history.find((item) =>
      item.changes.some((change) => change.kind === 'edited' && change.required === true)
    );
    expect(enforced).toBeTruthy();

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: enforced!.id }, { authorId: null });

    expect((await getLessonBlocks(lessonId))[0]).toMatchObject({ type: 'video', required: true });
  });

  it('restores the starting point with the text from before the first recorded change', async () => {
    const lessonId = await createLesson('restore-baseline-text');
    const note = await createLessonBlock(lessonId, { type: 'note', data: {}, content: '<p>draft</p>' });
    await writeText(lessonId, note.id, '<p>before</p>');
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    await db.delete(schema.lessonRevision).where(eq(schema.lessonRevision.lessonId, lessonId));

    await applyLegacyLessonContent(lessonId, {
      note: '<p>after</p>',
      videos: [{ type: 'youtube', link: 'https://youtu.be/baseline-text' }]
    });
    const startingPoint = (await historyOf(lessonId)).find(
      (item) => item.entryType === 'structure' && item.changes.length === 0
    );

    await restoreLessonToEntry(lessonId, { entryType: 'structure', entryId: startingPoint!.id }, { authorId: null });

    expect(await contentsOf(lessonId)).toEqual(['<p>before</p>']);
  });

  it('records the note block a translation write creates', async () => {
    const lessonId = await createLesson('translation-creates-note');

    await upsertLessonLanguageService(lessonId, { locale: 'fr', content: '<p>Bonjour</p>' });

    const [note] = await getLessonBlocks(lessonId);
    const added = (await historyOf(lessonId)).find((item) =>
      item.changes.some((change) => change.kind === 'added' && change.blockId === note.id)
    );
    expect(added).toBeTruthy();
  });
});
