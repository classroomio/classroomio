import type { TLocale } from '@cio/db/types';
import type { TBlockCreate, TBlockType, TPlacementUpdate } from '@cio/utils/validation/block';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import type { BlockDataSaveResult, BlockInitialContent, BlockOwner, BlockRecord } from '../utils/types';
import { anchorForIndex, findMovedId, insertAt, moveBy } from '../utils/block-list-utils';

const SAVE_DELAY_MS = 500;

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
  private unsavedData = new Set<string>();
  private savingData = new Set<string>();
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
    this.unsavedData.clear();

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

  /**
   * Applies a data edit locally and saves it after a short pause, so typing sends one request.
   */
  setData(blockId: string, data: Record<string, unknown>): void {
    if (!this.writeDataLocally(blockId, data)) return;

    this.scheduleSave();
  }

  /**
   * Applies a data edit locally and saves it, with every other pending edit, before resolving.
   */
  async updateData(blockId: string, data: Record<string, unknown>): Promise<void> {
    if (!this.writeDataLocally(blockId, data)) return;

    await this.flush();
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
    this.scheduleSave();
  }

  /**
   * Saves every pending text and data edit, one request at a time.
   */
  flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.saveQueue = this.saveQueue.then(() => this.saveUnsavedEdits());

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
    this.unsavedData.delete(blockId);
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

  private writeDataLocally(blockId: string, data: Record<string, unknown>): boolean {
    const block = this.find(blockId);
    if (!block) return false;

    this.revision += 1;
    block.data = data as BlockRecord['data'];
    this.unsavedData.add(blockId);

    return true;
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, SAVE_DELAY_MS);
  }

  private replace(record: BlockRecord): void {
    const merged = this.withLocalEdits(record);
    this.blocks = this.blocks.map((block) => (block.id === record.id ? merged : block));
  }

  private withLocalEdits(record: BlockRecord): BlockRecord {
    const local = this.find(record.id);
    if (!local) return record;

    const locales = [...(this.unsavedContent.get(record.id) ?? []), ...(this.savingContent.get(record.id) ?? [])];
    const hasLocalData = this.unsavedData.has(record.id) || this.savingData.has(record.id);
    if (locales.length === 0 && !hasLocalData) return record;

    const contents = { ...record.contents };
    for (const locale of locales) {
      contents[locale] = local.contents[locale];
    }

    const data = hasLocalData ? local.data : record.data;

    return { ...record, contents, data };
  }

  private markUnsaved(blockId: string, locale: TLocale): void {
    const locales = this.unsavedContent.get(blockId) ?? new Set<TLocale>();
    locales.add(locale);
    this.unsavedContent.set(blockId, locales);
  }

  private async saveUnsavedEdits(): Promise<void> {
    const owner = this.owner;
    if (!owner) return;

    await this.saveUnsavedContent(owner);
    await this.saveUnsavedData(owner);
  }

  private async saveUnsavedContent(owner: BlockOwner): Promise<void> {
    this.savingContent = new Map(this.unsavedContent);
    this.unsavedContent.clear();

    for (const [blockId, locales] of this.savingContent) {
      for (const locale of locales) {
        const saved = await this.saveContent(owner, blockId, locale);
        if (saved) continue;

        await this.reloadForRetry(owner);
        const retried = await this.saveContent(owner, blockId, locale);
        if (!retried) this.markUnsaved(blockId, locale);
      }
    }

    this.savingContent.clear();
  }

  private async saveUnsavedData(owner: BlockOwner): Promise<void> {
    this.savingData = new Set(this.unsavedData);
    this.unsavedData.clear();

    let rejected = false;
    for (const blockId of this.savingData) {
      const result = await this.saveData(owner, blockId);
      if (result.status === 'saved') continue;

      if (result.status === 'failed') {
        rejected = true;
        continue;
      }

      await this.reloadForRetry(owner);
      const retried = await this.saveData(owner, blockId);
      if (retried.status === 'saved') continue;

      rejected = true;
      if (retried.status === 'conflict') {
        snackbar.error(t.get('course.navItem.lessons.materials.blocks.save_failed', { reason: retried.reason }));
      }
    }

    this.savingData.clear();
    if (rejected) await this.reloadForRetry(owner);
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

  private async saveData(owner: BlockOwner, blockId: string): Promise<BlockDataSaveResult | { status: 'saved' }> {
    const block = this.find(blockId);
    if (!block) return { status: 'saved' };

    const result = await owner.updateData(blockId, block.data, block.version);
    if (result.status !== 'saved') return result;

    const current = this.find(blockId);
    if (current) current.version = result.record.version;

    return result;
  }

  private async reloadForRetry(owner: BlockOwner): Promise<void> {
    this.revision += 1;
    this.apply(owner, await owner.list());
  }

  private apply(owner: BlockOwner, records: BlockRecord[] | null): void {
    if (!records || owner !== this.owner) return;

    this.blocks = records.map((record) => this.withLocalEdits(record));
  }
}
