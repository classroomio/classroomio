import { lessonApi, lessonBlockApi } from '$features/course/api';
import { resolveLessonSlides } from '@cio/utils/functions';
import type { TLocale } from '@cio/db/types';
import type {
  Lesson,
  LessonBlock,
  LessonDocument,
  LessonDocumentBlock,
  LessonImageBlock,
  LessonNoteBlock,
  LessonSlideBlock,
  LessonVideoBlock,
  ServerLessonBlock
} from '../utils/types';
import {
  createDocumentBlock,
  createExampleDocumentBlock,
  createExampleVideo,
  createImageBlock,
  createNoteBlock,
  EXAMPLE_SLIDE_PLATFORM,
  EXAMPLE_SLIDE_SRC,
  insertLessonBlock,
  lessonDocumentKey,
  lessonSlideKey,
  slideMatchesSourceKey,
  lessonVideoKey,
  moveLessonBlock,
  upsertLessonBlock
} from '../utils/lesson-blocks';

type LessonVideo = NonNullable<Lesson['videos']>[number];
type LessonSlide = ReturnType<typeof resolveLessonSlides>[number];
type BridgeBlockType = 'video' | 'slide' | 'document';
type PendingAdd = { type: 'document'; index: number };
type PendingChange = { blockId: string; type: BridgeBlockType };

interface ServerBlockMeta {
  placementId: string;
  version: number;
}

function isBridgeBlock(block: LessonBlock): block is LessonVideoBlock | LessonSlideBlock | LessonDocumentBlock {
  return block.type === 'video' || block.type === 'slide' || block.type === 'document';
}

function editorBlockFromServer(block: ServerLessonBlock, style?: LessonNoteBlock['style']): LessonBlock | null {
  switch (block.type) {
    case 'video': {
      const video = block.data as unknown as LessonVideo;

      return {
        id: block.id,
        type: 'video' as const,
        sourceKey: lessonVideoKey(video),
        data: block.data as Record<string, unknown>
      };
    }
    case 'slides': {
      const slide = block.data as unknown as { src?: string };
      if (!slide?.src) return null;

      return {
        id: block.id,
        type: 'slide' as const,
        sourceKey: slide.src,
        data: block.data as Record<string, unknown>
      };
    }
    case 'document': {
      const document = block.data as unknown as LessonDocument;

      return {
        id: block.id,
        type: 'document' as const,
        sourceKey: lessonDocumentKey(document),
        data: block.data as Record<string, unknown>
      };
    }
    case 'note': {
      return { id: block.id, type: 'note', style: style ?? 'default' };
    }
    case 'image': {
      const image = block.data as unknown as { url?: string; alt?: string; fit?: LessonImageBlock['fit'] };
      if (!image?.url) return null;

      return {
        id: block.id,
        type: 'image',
        url: image.url,
        alt: image.alt ?? '',
        fit: image.fit ?? 'cover'
      };
    }
    default: {
      return null;
    }
  }
}

class LessonBlocksApi {
  blocks = $state<LessonBlock[]>([]);
  noteTranslations = $state<Record<string, Partial<Record<TLocale, string>>>>({});
  isReady = $state(false);
  lastInsertedBlockId = $state('');

  courseId = '';
  lessonId = '';
  private legacyNoteBlockId = '';
  private pendingAdd: PendingAdd | null = null;
  private pendingChange: PendingChange | null = null;
  private processingKeys = new Set<string>();
  private serverMeta = new Map<string, ServerBlockMeta>();
  private dirtyNotes = new Set<string>();
  private lastPayloadSignature = '';
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private loadRequestId = 0;
  private refreshRequestId = 0;
  private lastAppliedRefreshId = 0;

  async load(
    courseId: string,
    lessonId: string,
    lesson: Lesson,
    translations: Partial<Record<TLocale, string>>
  ): Promise<void> {
    const loadRequestId = ++this.loadRequestId;
    const blockIdsAtLoadStart = new Set(this.blocks.map((block) => block.id));

    this.courseId = courseId;
    this.lessonId = lessonId;
    this.isReady = false;
    this.pendingAdd = null;
    this.pendingChange = null;
    this.lastInsertedBlockId = '';
    this.serverMeta = new Map();
    this.dirtyNotes = new Set();
    this.legacyNoteBlockId = '';
    this.noteTranslations = {};

    let result = await lessonBlockApi.list({ courseId, lessonId });
    if (loadRequestId !== this.loadRequestId) return;

    if (!result) {
      result = await lessonBlockApi.list({ courseId, lessonId });
      if (loadRequestId !== this.loadRequestId) return;
    }

    const serverBlocks = result?.data ?? [];

    for (const block of serverBlocks) {
      this.serverMeta.set(block.id, { placementId: block.placementId, version: block.version });

      if (block.type === 'note') {
        this.noteTranslations[block.id] = { ...(block.contents as Partial<Record<TLocale, string>>) };
      }
    }

    const editorBlocks = serverBlocks
      .map((block) => editorBlockFromServer(block))
      .filter((block): block is LessonBlock => block !== null);
    const serverIds = new Set(editorBlocks.map((block) => block.id));

    // The legacy translations API still owns the first note's locales when present.
    const legacyNoteId = editorBlocks.find((block) => block.type === 'note')?.id;
    if (legacyNoteId && Object.keys(translations).length > 0) {
      this.legacyNoteBlockId = legacyNoteId;
      this.noteTranslations[legacyNoteId] = { ...this.noteTranslations[legacyNoteId], ...translations };
    }

    // Blocks are the source of truth: an empty block list means the lesson has no
    // content, so nothing is rebuilt from the legacy `note` column here.

    const addedDuringLoad = this.blocks.filter(
      (block) => !blockIdsAtLoadStart.has(block.id) && !serverIds.has(block.id)
    );

    this.blocks = [...editorBlocks, ...addedDuringLoad];
    this.isReady = true;
    this.lastPayloadSignature = (lesson.blocks ?? []).map((block) => block.id).join('|');
  }

  syncFromLesson(lesson: Lesson): void {
    if (!this.isReady || lesson.id !== this.lessonId) return;

    const serverBlocks = (lesson as Lesson & { blocks?: ServerLessonBlock[] }).blocks;

    // The lesson payload lags behind the block API (an autosave response can carry a
    // list from before a block was created), so it only signals that something
    // changed. The authoritative list is always fetched from the block endpoint.
    if (Array.isArray(serverBlocks)) {
      const signature = serverBlocks.map((block) => block.id).join('|');

      if (signature !== this.lastPayloadSignature) {
        this.lastPayloadSignature = signature;
        void this.refresh();
      }
    }

    void this.bridgeLegacyItems(lesson);
  }

  syncLegacyTranslations(translations: Partial<Record<TLocale, string>>): void {
    if (!this.legacyNoteBlockId || !this.noteTranslations[this.legacyNoteBlockId]) return;

    const current = this.noteTranslations[this.legacyNoteBlockId];

    for (const [locale, content] of Object.entries(translations)) {
      if (!content || current[locale]) continue;

      current[locale] = content;
    }
  }

  async addNoteBlock(index: number, locale: TLocale, content: string): Promise<string> {
    const { block: localBlock, translations } = createNoteBlock(content, locale);

    this.blocks = insertLessonBlock(this.blocks, localBlock, index);
    this.noteTranslations[localBlock.id] = translations;
    this.lastInsertedBlockId = localBlock.id;

    const anchor = this.anchorForIndex(index);
    const result = await lessonBlockApi.create(
      { courseId: this.courseId, lessonId: this.lessonId },
      { type: 'note', data: {}, content, locale, ...anchor }
    );
    const created = result?.data;

    if (created) {
      this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
      this.noteTranslations[created.id] = (created.contents as Partial<Record<TLocale, string>>) ?? translations;
      delete this.noteTranslations[localBlock.id];
      this.blocks = upsertLessonBlock(
        this.blocks,
        { id: created.id, type: 'note', style: localBlock.style },
        index,
        localBlock.id
      );
      this.lastInsertedBlockId = created.id;
    }

    return this.lastInsertedBlockId;
  }

  async addImageBlock(index: number): Promise<string> {
    const block = createImageBlock();

    this.blocks = insertLessonBlock(this.blocks, block, index);
    this.lastInsertedBlockId = block.id;

    const anchor = this.anchorForIndex(index);
    const data = { url: block.url, alt: block.alt, fit: block.fit };
    const result = await lessonBlockApi.create(
      { courseId: this.courseId, lessonId: this.lessonId },
      { type: 'image', data, ...anchor }
    );
    const created = result?.data;

    if (!created) return this.lastInsertedBlockId;

    this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
    this.blocks = upsertLessonBlock(this.blocks, { ...block, id: created.id, isExample: false }, index, block.id);
    this.lastInsertedBlockId = created.id;

    return created.id;
  }

  async addExampleSlide(index: number): Promise<void> {
    await this.addSlideBlock(
      {
        id: '',
        src: EXAMPLE_SLIDE_SRC,
        platform: EXAMPLE_SLIDE_PLATFORM
      } as LessonSlide,
      index
    );
  }

  addExampleDocument(index: number): string {
    const block = createExampleDocumentBlock();

    this.blocks = insertLessonBlock(this.blocks, block, index);
    this.lastInsertedBlockId = block.id;

    return block.id;
  }

  getExampleVideo(): LessonVideo {
    return createExampleVideo() as unknown as LessonVideo;
  }

  /** The demo video shape sent to the API: same metadata, without the placeholder key. */
  private getExampleVideoData(): LessonVideo {
    const {
      key: _key,
      watchEnforced: _watchEnforced,
      ...data
    } = createExampleVideo() as LessonVideo & {
      watchEnforced?: boolean;
    };

    return data as LessonVideo;
  }

  async addExampleVideo(index: number): Promise<void> {
    const data = this.getExampleVideoData();
    const anchor = this.anchorForIndex(index);
    const result = await lessonBlockApi.create(
      { courseId: this.courseId, lessonId: this.lessonId },
      { type: 'video', data: data as never, ...anchor }
    );
    const created = result?.data;
    if (!created) return;

    this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
    const editorBlock: LessonVideoBlock = {
      id: created.id,
      type: 'video',
      sourceKey: lessonVideoKey(data),
      data: data as Record<string, unknown>
    };
    this.blocks = upsertLessonBlock(this.blocks, editorBlock, index);
    this.lastInsertedBlockId = created.id;
    this.upsertLegacyVideo(data);
  }

  async addSlideBlock(slide: LessonSlide, index: number): Promise<void> {
    const anchor = this.anchorForIndex(index);
    const slideData = { src: slide.src, platform: slide.platform };
    const result = await lessonBlockApi.create(
      { courseId: this.courseId, lessonId: this.lessonId },
      { type: 'slides', data: slideData, ...anchor }
    );
    const created = result?.data;
    if (!created) return;

    this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
    const editorBlock: LessonSlideBlock = { id: created.id, type: 'slide', sourceKey: slide.src, data: slideData };
    this.blocks = upsertLessonBlock(this.blocks, editorBlock, index);
    this.lastInsertedBlockId = created.id;
    this.upsertLegacySlide({ ...(slide as object), id: created.id } as LessonSlide);
  }

  beginAddDocument(index: number): void {
    this.pendingAdd = { type: 'document', index };
  }

  beginChangeVideo(blockId: string): void {
    this.pendingChange = { blockId, type: 'video' };
  }

  beginChangeDocument(blockId: string): void {
    this.pendingChange = { blockId, type: 'document' };
  }

  clearPendingAdd(): void {
    this.pendingAdd = null;
  }

  clearPendingChange(): void {
    this.pendingChange = null;
  }

  async replaceSlideBlock(blockId: string, slide: LessonSlide): Promise<void> {
    const blockIndex = this.blocks.findIndex(
      (candidate): candidate is LessonSlideBlock => candidate.id === blockId && candidate.type === 'slide'
    );
    if (blockIndex === -1) return;

    const meta = this.serverMeta.get(blockId);
    const slideData = { src: slide.src, platform: slide.platform };

    if (!meta) {
      const anchor = this.anchorForIndex(blockIndex);
      const result = await lessonBlockApi.create(
        { courseId: this.courseId, lessonId: this.lessonId },
        { type: 'slides', data: slideData, ...anchor }
      );
      const created = result?.data;
      if (!created) return;

      this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
      this.blocks = upsertLessonBlock(
        this.blocks,
        { id: created.id, type: 'slide', sourceKey: slide.src, data: slideData },
        blockIndex,
        blockId
      );
      this.lastInsertedBlockId = created.id;
      this.upsertLegacySlide({ ...(slide as object), id: created.id } as LessonSlide);
      return;
    }

    const result = await lessonBlockApi.updateData(
      { courseId: this.courseId, lessonId: this.lessonId, blockId },
      { data: slideData, expectedVersion: meta.version }
    );
    const updated = result?.data;
    if (!updated) return;

    meta.version = updated.version;
    this.blocks = this.blocks.map((candidate) =>
      candidate.id === blockId ? { ...candidate, sourceKey: slide.src, data: slideData, isExample: false } : candidate
    );
    this.lastInsertedBlockId = blockId;
    this.upsertLegacySlide({ ...(slide as object), id: blockId } as LessonSlide);
    this.syncLegacyOrder();
  }

  async updateImageBlock(
    blockId: string,
    patch: Partial<Pick<LessonImageBlock, 'url' | 'fileKey' | 'alt' | 'fit'>>
  ): Promise<void> {
    const index = this.blocks.findIndex(
      (candidate): candidate is LessonImageBlock => candidate.id === blockId && candidate.type === 'image'
    );
    if (index === -1) return;

    const block = this.blocks[index] as LessonImageBlock;
    Object.assign(block, patch);
    if (patch.url) block.isExample = false;

    const meta = this.serverMeta.get(blockId);
    const data = { url: block.url, alt: block.alt, fit: block.fit };

    if (!meta && block.url) {
      const anchor = this.anchorForIndex(index);
      const result = await lessonBlockApi.create(
        { courseId: this.courseId, lessonId: this.lessonId },
        { type: 'image', data, ...anchor }
      );
      const created = result?.data;
      if (!created) return;

      this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
      this.blocks = upsertLessonBlock(this.blocks, { ...block, id: created.id, isExample: false }, index, blockId);
      this.lastInsertedBlockId = created.id;
      return;
    }

    if (meta) {
      const result = await lessonBlockApi.updateData(
        { courseId: this.courseId, lessonId: this.lessonId, blockId },
        { data, expectedVersion: meta.version }
      );
      const updated = result?.data;
      if (updated) meta.version = updated.version;
    }
  }

  setImageFit(blockId: string, fit: LessonImageBlock['fit']): void {
    this.updateImageBlock(blockId, { fit });
  }

  setNoteStyle(blockId: string, style: LessonNoteBlock['style']): void {
    const block = this.blocks.find(
      (candidate): candidate is LessonNoteBlock => candidate.id === blockId && candidate.type === 'note'
    );
    if (!block) return;

    block.style = style;
  }

  setNoteContent(blockId: string, locale: TLocale, content: string): void {
    if (!this.noteTranslations[blockId]) {
      this.noteTranslations[blockId] = {};
    }

    this.noteTranslations[blockId][locale] = content;

    if (blockId === this.legacyNoteBlockId) {
      lessonApi.updateTranslation(this.lessonId, locale, content);
      lessonApi.markDirty();
    }

    if (this.serverMeta.has(blockId)) {
      this.dirtyNotes.add(blockId);
      this.persistSoon();
      return;
    }
  }

  getNoteContent(blockId: string, locale: TLocale): string {
    return this.noteTranslations[blockId]?.[locale] ?? '';
  }

  async removeBlock(blockId: string): Promise<void> {
    const block = this.blocks.find((candidate) => candidate.id === blockId);
    if (!block) return;

    const meta = this.serverMeta.get(blockId);

    if (block.type === 'note') {
      delete this.noteTranslations[block.id];

      if (block.id === this.legacyNoteBlockId) {
        lessonApi.translations[this.lessonId] = {} as Record<TLocale, string>;
        lessonApi.markDirty();
        this.legacyNoteBlockId = '';
      }
    }

    if (meta) {
      const result = await lessonBlockApi.removePlacement({
        courseId: this.courseId,
        lessonId: this.lessonId,
        placementId: meta.placementId
      });

      if (!result) return;

      this.serverMeta.delete(blockId);
      this.dirtyNotes.delete(blockId);

      if (isBridgeBlock(block)) {
        this.stripLegacyItem(block);
      }
    }

    this.blocks = this.blocks.filter((candidate) => candidate.id !== blockId);
    if (this.lastInsertedBlockId === blockId) this.lastInsertedBlockId = '';
    this.syncLegacyOrder();
  }

  async moveBlock(blockId: string, direction: -1 | 1): Promise<void> {
    const index = this.blocks.findIndex((candidate) => candidate.id === blockId);
    if (index === -1) return;

    const nextBlocks = moveLessonBlock(this.blocks, blockId, direction);
    if (nextBlocks === this.blocks) return;

    await this.reorderBlocks(nextBlocks);
  }

  async reorderBlocks(blocks: LessonBlock[]): Promise<void> {
    const moved = blocks.find((candidate, index) => this.blocks[index]?.id !== candidate.id);
    this.blocks = blocks;
    this.syncLegacyOrder();

    if (!moved) return;

    const meta = this.serverMeta.get(moved.id);
    if (!meta) return;

    const index = blocks.findIndex((candidate) => candidate.id === moved.id);
    const anchor = this.anchorForIndex(index, moved.id);

    if (!anchor.beforePlacementId && !anchor.afterPlacementId) return;

    const result = await lessonBlockApi.movePlacement(
      { courseId: this.courseId, lessonId: this.lessonId, placementId: meta.placementId },
      anchor
    );

    if (!result?.data) {
      await this.refresh();
    }
  }

  private anchorForIndex(index: number, excludeId?: string): { beforePlacementId?: string; afterPlacementId?: string } {
    const ordered = this.blocks.filter((candidate) => candidate.id !== excludeId);
    const next = ordered.slice(index).find((candidate) => this.serverMeta.has(candidate.id));

    if (next) {
      return { beforePlacementId: this.serverMeta.get(next.id)?.placementId };
    }

    const previous = [...ordered.slice(0, index)].reverse().find((candidate) => this.serverMeta.has(candidate.id));

    return previous ? { afterPlacementId: this.serverMeta.get(previous.id)?.placementId } : {};
  }

  private reconcileWithServer(serverBlocks: ServerLessonBlock[], blockIdsAtRequestStart: Set<string>): void {
    const previousIndices = new Map(this.blocks.map((block, index) => [block.id, index] as const));
    const previousStyles = new Map(
      this.blocks
        .filter((block): block is LessonNoteBlock => block.type === 'note')
        .map((block) => [block.id, block.style] as const)
    );

    for (const block of serverBlocks) {
      this.serverMeta.set(block.id, { placementId: block.placementId, version: block.version });

      if (block.type === 'note' && !this.dirtyNotes.has(block.id)) {
        this.noteTranslations[block.id] = { ...(block.contents as Partial<Record<TLocale, string>>) };
      }
    }

    const knownIds = new Set(serverBlocks.map((block) => block.id));
    const existingById = new Map(this.blocks.map((block) => [block.id, block] as const));
    const mapped = serverBlocks
      .map((block) => {
        const existing = existingById.get(block.id);
        if (existing) return existing;

        return editorBlockFromServer(block, previousStyles.get(block.id));
      })
      .filter((block): block is LessonBlock => block !== null);

    for (const block of this.blocks) {
      if (knownIds.has(block.id)) continue;

      // A block created after the request started is absent from a response that
      // was computed earlier; it must survive the reconcile, not be treated as
      // deleted. Blocks that were already known are still dropped when the server
      // no longer returns them.
      const localOnly = block.type === 'image' && !this.serverMeta.has(block.id);
      const existedBeforeRequest = blockIdsAtRequestStart.has(block.id);
      if (!localOnly && existedBeforeRequest) continue;

      const at = Math.max(0, Math.min(previousIndices.get(block.id) ?? mapped.length, mapped.length));
      mapped.splice(at, 0, block);
    }

    this.blocks = mapped;
  }

  private async bridgeLegacyItems(lesson: Lesson): Promise<void> {
    const videos = lesson.videos ?? [];
    const documents = lesson.documents ?? [];

    const editorKeys = new Set(this.blocks.filter(isBridgeBlock).map((block) => `${block.type}:${block.sourceKey}`));

    let newVideos = videos.filter((video) => !editorKeys.has(`video:${lessonVideoKey(video)}`));
    let newDocuments = documents.filter((document) => !editorKeys.has(`document:${lessonDocumentKey(document)}`));

    if (this.pendingChange?.type === 'video' && newVideos.length > 0) {
      await this.applyVideoChange(this.pendingChange.blockId, newVideos[0]);
      newVideos = newVideos.slice(1);
    } else if (this.pendingChange?.type === 'document' && newDocuments.length > 0) {
      await this.applyDocumentChange(this.pendingChange.blockId, newDocuments[0]);
      newDocuments = newDocuments.slice(1);
    }

    const pendingIndex = this.pendingAdd?.type === 'document' ? this.pendingAdd.index : null;
    this.pendingAdd = null;

    let insertIndex = pendingIndex ?? this.blocks.length;
    for (const document of newDocuments) {
      await this.applyDocumentAdd(document, insertIndex);
      insertIndex += 1;
    }

    for (const video of newVideos) {
      await this.applyVideoAdd(video);
    }
  }

  private async applyVideoAdd(video: LessonVideo): Promise<void> {
    const key = `video:${lessonVideoKey(video)}`;
    if (this.processingKeys.has(key)) return;
    this.processingKeys.add(key);

    try {
      const { watchEnforced, ...videoData } = video as LessonVideo & { watchEnforced?: boolean };
      const result = await lessonBlockApi.create(
        { courseId: this.courseId, lessonId: this.lessonId },
        { type: 'video', data: videoData as never, required: Boolean(watchEnforced) }
      );
      const created = result?.data;
      if (!created) return;

      this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
      const editorBlock: LessonVideoBlock = {
        id: created.id,
        type: 'video',
        sourceKey: lessonVideoKey(video),
        data: videoData as Record<string, unknown>
      };
      this.blocks = upsertLessonBlock(this.blocks, editorBlock, this.blocks.length);
      this.lastInsertedBlockId = created.id;
    } finally {
      this.processingKeys.delete(key);
    }
  }

  private async applyVideoChange(blockId: string, video: LessonVideo): Promise<void> {
    const key = `video:${lessonVideoKey(video)}`;
    if (this.processingKeys.has(key)) return;
    this.processingKeys.add(key);

    try {
      const block = this.blocks.find((candidate) => candidate.id === blockId);
      const meta = this.serverMeta.get(blockId);
      const { watchEnforced: _watchEnforced, ...videoData } = video as LessonVideo & { watchEnforced?: boolean };

      if (!block || block.type !== 'video') {
        this.pendingChange = null;
        return;
      }

      if (!meta) {
        const index = this.blocks.findIndex((candidate) => candidate.id === blockId);
        const anchor = this.anchorForIndex(index, blockId);
        const result = await lessonBlockApi.create(
          { courseId: this.courseId, lessonId: this.lessonId },
          {
            type: 'video',
            data: videoData as never,
            required: Boolean(video.watchEnforced),
            ...anchor
          }
        );
        const created = result?.data;
        if (!created) return;

        this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
        this.blocks = upsertLessonBlock(
          this.blocks,
          {
            id: created.id,
            type: 'video',
            sourceKey: lessonVideoKey(video),
            data: videoData as Record<string, unknown>
          },
          index,
          blockId
        );
        this.lastInsertedBlockId = created.id;
        this.removeLegacyVideo(video, true);
      } else {
        const result = await lessonBlockApi.updateData(
          { courseId: this.courseId, lessonId: this.lessonId, blockId },
          { data: videoData as never, expectedVersion: meta.version }
        );
        const updated = result?.data;
        if (!updated) return;

        meta.version = updated.version;
        const oldSourceKey = block.sourceKey;
        this.blocks = this.blocks.map((candidate) =>
          candidate.id === blockId
            ? {
                ...candidate,
                sourceKey: lessonVideoKey(video),
                data: videoData as Record<string, unknown>,
                isExample: false
              }
            : candidate
        );
        this.removeLegacyVideo(video, true, oldSourceKey);
      }

      this.pendingChange = null;
      this.syncLegacyOrder();
    } finally {
      this.processingKeys.delete(key);
    }
  }

  private async applyDocumentChange(blockId: string, document: LessonDocument): Promise<void> {
    const key = `document:${lessonDocumentKey(document)}`;
    if (this.processingKeys.has(key)) return;
    this.processingKeys.add(key);

    try {
      const block = this.blocks.find((candidate) => candidate.id === blockId);
      const meta = this.serverMeta.get(blockId);

      if (!block || block.type !== 'document') {
        this.pendingChange = null;
        return;
      }

      if (!meta) {
        const index = this.blocks.findIndex((candidate) => candidate.id === blockId);
        const anchor = this.anchorForIndex(index, blockId);
        const result = await lessonBlockApi.create(
          { courseId: this.courseId, lessonId: this.lessonId },
          { type: 'document', data: { ...document } as never, ...anchor }
        );
        const created = result?.data;
        if (!created) return;

        this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
        this.blocks = upsertLessonBlock(
          this.blocks,
          {
            id: created.id,
            type: 'document',
            sourceKey: lessonDocumentKey(document),
            data: { ...document } as Record<string, unknown>
          },
          index,
          blockId
        );
        this.lastInsertedBlockId = created.id;
        this.removeLegacyDocument(document, true);
      } else {
        const result = await lessonBlockApi.updateData(
          { courseId: this.courseId, lessonId: this.lessonId, blockId },
          { data: { ...document } as never, expectedVersion: meta.version }
        );
        const updated = result?.data;
        if (!updated) return;

        meta.version = updated.version;
        const oldSourceKey = block.sourceKey;
        this.blocks = this.blocks.map((candidate) =>
          candidate.id === blockId
            ? {
                ...candidate,
                sourceKey: lessonDocumentKey(document),
                data: { ...document } as Record<string, unknown>,
                isExample: false
              }
            : candidate
        );
        this.removeLegacyDocument(document, true, oldSourceKey);
      }

      this.pendingChange = null;
      this.syncLegacyOrder();
    } finally {
      this.processingKeys.delete(key);
    }
  }

  private async applyDocumentAdd(document: LessonDocument, index: number): Promise<void> {
    const key = `document:${lessonDocumentKey(document)}`;
    if (this.processingKeys.has(key)) return;
    this.processingKeys.add(key);

    try {
      const anchor = this.anchorForIndex(index);
      const result = await lessonBlockApi.create(
        { courseId: this.courseId, lessonId: this.lessonId },
        { type: 'document', data: { ...document } as never, ...anchor }
      );
      const created = result?.data;
      if (!created) return;

      this.serverMeta.set(created.id, { placementId: created.placementId, version: created.version });
      const editorBlock = createDocumentBlock(lessonDocumentKey(document), false);
      editorBlock.id = created.id;
      editorBlock.data = { ...document } as Record<string, unknown>;
      this.blocks = upsertLessonBlock(this.blocks, editorBlock, index);
      this.lastInsertedBlockId = created.id;
    } finally {
      this.processingKeys.delete(key);
    }
  }

  private async refresh(): Promise<void> {
    if (!this.courseId || !this.lessonId) return;

    const requestId = ++this.refreshRequestId;
    const blockIdsAtRequestStart = new Set(this.blocks.map((block) => block.id));
    const result = await lessonBlockApi.list({ courseId: this.courseId, lessonId: this.lessonId });
    const serverBlocks = result?.data;
    if (!serverBlocks) return;

    if (requestId < this.lastAppliedRefreshId) return;

    this.lastAppliedRefreshId = requestId;
    this.reconcileWithServer(serverBlocks, blockIdsAtRequestStart);
  }

  private upsertLegacyVideo(video: LessonVideo): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    const videos = lesson.videos ?? [];
    const key = lessonVideoKey(video);
    const exists = videos.some((candidate) => lessonVideoKey(candidate) === key);

    if (exists) return;

    lessonApi.updateLessonState('videos', [...videos, video]);
  }

  private upsertLegacySlide(slide: LessonSlide): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    const slides = resolveLessonSlides(lesson.slides, lesson.slideUrl);
    const key = lessonSlideKey(slide);
    const exists = slides.some((candidate) => lessonSlideKey(candidate) === key);
    const nextSlides = exists
      ? slides.map((candidate) => (lessonSlideKey(candidate) === key ? slide : candidate))
      : [...slides, slide];

    lessonApi.updateLessonState('slides', nextSlides);
    lessonApi.updateLessonState('slideUrl', nextSlides[0]?.src ?? '');
  }

  private removeLegacyVideo(video: LessonVideo, keepNew: boolean, oldSourceKey?: string): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    const videos = lesson.videos ?? [];
    const nextVideos = videos.filter((candidate) => {
      const key = lessonVideoKey(candidate);

      if (keepNew && key === lessonVideoKey(video)) return true;

      return oldSourceKey ? key !== oldSourceKey : key !== lessonVideoKey(video);
    });

    if (nextVideos.length !== videos.length) {
      lessonApi.updateLessonState('videos', nextVideos);
    }
  }

  private removeLegacyDocument(document: LessonDocument, keepNew: boolean, oldSourceKey?: string): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    const documents = lesson.documents ?? [];
    const nextDocuments = documents.filter((candidate) => {
      const key = lessonDocumentKey(candidate);

      if (keepNew && key === lessonDocumentKey(document)) return true;

      return oldSourceKey ? key !== oldSourceKey : key !== lessonDocumentKey(document);
    });

    if (nextDocuments.length !== documents.length) {
      lessonApi.updateLessonState('documents', nextDocuments);
    }
  }

  private stripLegacyItem(block: LessonVideoBlock | LessonSlideBlock | LessonDocumentBlock): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    if (block.type === 'video') {
      const videos = lesson.videos ?? [];
      const nextVideos = videos.filter((video) => lessonVideoKey(video) !== block.sourceKey);

      if (nextVideos.length !== videos.length) {
        lessonApi.updateLessonState('videos', nextVideos);
      }

      return;
    }

    if (block.type === 'slide') {
      const slides = resolveLessonSlides(lesson.slides, lesson.slideUrl);
      const nextSlides = slides.filter((slide) => !slideMatchesSourceKey(slide, block.sourceKey));

      if (nextSlides.length !== slides.length) {
        lessonApi.updateLessonState('slides', nextSlides);
        lessonApi.updateLessonState('slideUrl', nextSlides[0]?.src ?? '');
      }

      return;
    }

    const documents = lesson.documents ?? [];
    const nextDocuments = documents.filter((document) => lessonDocumentKey(document) !== block.sourceKey);

    if (nextDocuments.length !== documents.length) {
      lessonApi.updateLessonState('documents', nextDocuments);
    }
  }

  private syncLegacyOrder(): void {
    const lesson = lessonApi.lesson;
    if (!lesson) return;

    const videos = lesson.videos ?? [];
    const orderedVideos = this.blocks
      .filter((block): block is LessonVideoBlock => block.type === 'video')
      .map((block) => videos.find((video) => lessonVideoKey(video) === block.sourceKey))
      .filter((video): video is LessonVideo => video != null);

    if (
      orderedVideos.length === videos.length &&
      orderedVideos.some((video, index) => lessonVideoKey(video) !== lessonVideoKey(videos[index]))
    ) {
      lessonApi.updateLessonState('videos', orderedVideos);
    }

    const slides = resolveLessonSlides(lesson.slides, lesson.slideUrl);
    const orderedSlides = this.blocks
      .filter((block): block is LessonSlideBlock => block.type === 'slide')
      .map((block) => slides.find((slide) => slideMatchesSourceKey(slide, block.sourceKey)))
      .filter((slide): slide is LessonSlide => slide != null);

    if (
      orderedSlides.length === slides.length &&
      orderedSlides.some((slide, index) => lessonSlideKey(slide) !== lessonSlideKey(slides[index]))
    ) {
      lessonApi.updateLessonState('slides', orderedSlides);
      lessonApi.updateLessonState('slideUrl', orderedSlides[0]?.src ?? '');
    }

    const documents = lesson.documents ?? [];
    const orderedDocuments = this.blocks
      .filter((block): block is LessonDocumentBlock => block.type === 'document')
      .map((block) => documents.find((document) => lessonDocumentKey(document) === block.sourceKey))
      .filter((document): document is LessonDocument => document != null);

    if (
      orderedDocuments.length === documents.length &&
      orderedDocuments.some((document, index) => lessonDocumentKey(document) !== lessonDocumentKey(documents[index]))
    ) {
      lessonApi.updateLessonState('documents', orderedDocuments);
    }
  }

  private persistSoon(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.flushNotes();
    }, 500);
  }

  private async flushNotes(): Promise<void> {
    const pending = [...this.dirtyNotes];
    if (pending.length === 0) return;

    for (const blockId of pending) {
      const meta = this.serverMeta.get(blockId);
      const content = this.noteTranslations[blockId]?.[lessonApi.currentLocale];
      if (!meta || content === undefined) {
        this.dirtyNotes.delete(blockId);
        continue;
      }

      const result = await lessonBlockApi.updateLocale(
        { courseId: this.courseId, lessonId: this.lessonId, blockId, locale: lessonApi.currentLocale },
        { content, expectedVersion: meta.version }
      );

      if (result?.data) {
        meta.version = result.data.version;
        this.dirtyNotes.delete(blockId);
        continue;
      }

      await this.refresh();

      const retryMeta = this.serverMeta.get(blockId);
      const retryContent = this.noteTranslations[blockId]?.[lessonApi.currentLocale];
      if (!retryMeta || retryContent === undefined) {
        this.dirtyNotes.delete(blockId);
        continue;
      }

      const retry = await lessonBlockApi.updateLocale(
        { courseId: this.courseId, lessonId: this.lessonId, blockId, locale: lessonApi.currentLocale },
        { content: retryContent, expectedVersion: retryMeta.version }
      );

      if (retry?.data) {
        retryMeta.version = retry.data.version;
        this.noteTranslations[blockId] = {
          ...(retry.data.contents as Partial<Record<TLocale, string>>)
        };
        this.dirtyNotes.delete(blockId);
      }
    }
  }
}

export const lessonBlocksApi = new LessonBlocksApi();
