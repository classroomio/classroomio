import type { TLocale } from '@cio/db/types';
import type { TBlockCreate, TBlockType, TPlacementUpdate } from '@cio/utils/validation/block';
import type { BlockInitialContent, BlockOwner, BlockRecord } from '../utils/types';
import { anchorForIndex, findMovedId, insertAt, moveBy } from '../utils/block-list-utils';

const CONTENT_SAVE_DELAY_MS = 500;

/**
 * The ordered blocks of one owner, such as a lesson, and every write to them.
 */
export class BlockListApi {
  blocks = $state<BlockRecord[]>([]);
  isReady = $state(false);
  lastInsertedId = $state('');

  private owner: BlockOwner | null = null;
  private loadId = 0;
  private revision = 0;
  private unsavedContent = new Map<string, Set<TLocale>>();
  private savingContent = new Map<string, Set<TLocale>>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  private payloadSignature = '';

  async load(owner: BlockOwner): Promise<void> {
    const loadId = ++this.loadId;

    this.owner = owner;
    this.isReady = false;
    this.blocks = [];
    this.lastInsertedId = '';
    this.unsavedContent.clear();

    const records = await owner.list();
    if (loadId !== this.loadId) return;

    this.blocks = records ?? [];
    this.payloadSignature = this.blocks.map((block) => block.id).join('|');
    this.isReady = true;
  }

  /**
   * Reloads the list from the server. A response that started before a local write is dropped,
   * because it cannot contain that write.
   */
  async refresh(): Promise<void> {
    const owner = this.owner;
    if (!owner) return;

    const revision = this.revision;
    const records = await owner.list();
    if (revision !== this.revision) return;

    this.apply(owner, records);
  }

  /**
   * Refreshes when another response (the lesson payload after an AI edit, say) reports a different
   * set of block ids than the last one it reported.
   */
  syncFromPayload(blockIds: string[]): void {
    const signature = blockIds.join('|');
    if (!this.isReady || signature === this.payloadSignature) return;

    this.payloadSignature = signature;
    void this.refresh();
  }

  async insert<K extends TBlockType>(
    type: K,
    index: number,
    initial: BlockInitialContent<K>,
    locale: TLocale
  ): Promise<BlockRecord | null> {
    const owner = this.owner;
    if (!owner) return null;

    this.revision += 1;
    const anchor = anchorForIndex(this.blocks, index);
    const input = { type, data: initial.data, content: initial.content, locale, ...anchor } as TBlockCreate;
    const record = await owner.create(input);
    if (!record || owner !== this.owner) return null;

    this.revision += 1;
    this.blocks = insertAt(this.blocks, record, this.indexForAnchor(anchor));
    this.lastInsertedId = record.id;

    return record;
  }

  async updateData(blockId: string, data: Record<string, unknown>): Promise<void> {
    const owner = this.owner;
    const block = this.find(blockId);
    if (!owner || !block) return;

    this.revision += 1;
    block.data = data as BlockRecord['data'];

    const record = await owner.updateData(blockId, data, block.version);
    if (!record) {
      await this.refresh();
      return;
    }

    this.replace(record);
  }

  async setPlacement(blockId: string, settings: TPlacementUpdate): Promise<void> {
    const owner = this.owner;
    const block = this.find(blockId);
    if (!owner || !block) return;

    this.revision += 1;
    const record = await owner.updatePlacement(block.placementId, settings);
    if (record) this.replace(record);
  }

  setContent(blockId: string, locale: TLocale, content: string): void {
    const block = this.find(blockId);
    if (!block || block.contents[locale] === content) return;

    block.contents[locale] = content;
    this.markUnsaved(blockId, locale);

    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, CONTENT_SAVE_DELAY_MS);
  }

  /**
   * Saves every pending text edit, one request at a time.
   */
  flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.saveQueue = this.saveQueue.then(() => this.saveUnsavedContent());

    return this.saveQueue;
  }

  async remove(blockId: string): Promise<void> {
    const owner = this.owner;
    const block = this.find(blockId);
    if (!owner || !block) return;

    this.revision += 1;
    const removed = await owner.remove(block.placementId);
    if (!removed) return;

    this.blocks = this.blocks.filter((candidate) => candidate.id !== blockId);
    this.unsavedContent.delete(blockId);
    if (this.lastInsertedId === blockId) this.lastInsertedId = '';
  }

  async move(blockId: string, direction: -1 | 1): Promise<void> {
    const next = moveBy(this.blocks, blockId, direction);
    if (next === this.blocks) return;

    await this.reorder(next);
  }

  async reorder(next: BlockRecord[]): Promise<void> {
    const owner = this.owner;
    const movedId = findMovedId(this.blocks, next);
    const moved = movedId ? this.find(movedId) : undefined;

    this.revision += 1;
    this.blocks = next;
    if (!owner || !moved) return;

    const anchor = anchorForIndex(next, next.indexOf(moved), moved.id);
    if (!anchor.beforePlacementId && !anchor.afterPlacementId) return;

    const record = await owner.move(moved.placementId, anchor as Required<typeof anchor>);
    if (!record) await this.refresh();
  }

  private find(blockId: string): BlockRecord | undefined {
    return this.blocks.find((block) => block.id === blockId);
  }

  private indexForAnchor(anchor: ReturnType<typeof anchorForIndex>): number {
    if (anchor.beforePlacementId) {
      const index = this.blocks.findIndex((block) => block.placementId === anchor.beforePlacementId);
      if (index !== -1) return index;
    }

    if (anchor.afterPlacementId) {
      const index = this.blocks.findIndex((block) => block.placementId === anchor.afterPlacementId);
      if (index !== -1) return index + 1;
    }

    return this.blocks.length;
  }

  private replace(record: BlockRecord): void {
    const merged = this.withUnsavedContent(record);
    this.blocks = this.blocks.map((block) => (block.id === record.id ? merged : block));
  }

  private withUnsavedContent(record: BlockRecord): BlockRecord {
    const local = this.find(record.id);
    const locales = [...(this.unsavedContent.get(record.id) ?? []), ...(this.savingContent.get(record.id) ?? [])];
    if (!local || locales.length === 0) return record;

    const contents = { ...record.contents };
    for (const locale of locales) {
      contents[locale] = local.contents[locale];
    }

    return { ...record, contents };
  }

  private markUnsaved(blockId: string, locale: TLocale): void {
    const locales = this.unsavedContent.get(blockId) ?? new Set<TLocale>();
    locales.add(locale);
    this.unsavedContent.set(blockId, locales);
  }

  private async saveUnsavedContent(): Promise<void> {
    const owner = this.owner;
    if (!owner) return;

    this.savingContent = new Map(this.unsavedContent);
    this.unsavedContent.clear();

    for (const [blockId, locales] of this.savingContent) {
      for (const locale of locales) {
        const saved = await this.saveContent(owner, blockId, locale);
        if (saved) continue;

        const retried = await this.retryAfterRefresh(owner, blockId, locale);
        if (!retried) this.markUnsaved(blockId, locale);
      }
    }

    this.savingContent.clear();
  }

  private async saveContent(owner: BlockOwner, blockId: string, locale: TLocale): Promise<boolean> {
    const block = this.find(blockId);
    if (!block) return true;

    const record = await owner.updateContent(blockId, locale, block.contents[locale] ?? '', block.version);
    if (!record) return false;

    const current = this.find(blockId);
    if (current) current.version = record.version;

    return true;
  }

  private async retryAfterRefresh(owner: BlockOwner, blockId: string, locale: TLocale): Promise<boolean> {
    this.revision += 1;
    this.apply(owner, await owner.list());

    return this.saveContent(owner, blockId, locale);
  }

  private apply(owner: BlockOwner, records: BlockRecord[] | null): void {
    if (!records || owner !== this.owner) return;

    this.blocks = records.map((record) => this.withUnsavedContent(record));
  }
}
