import { SvelteMap } from 'svelte/reactivity';

import { MEDIA_UPLOAD_MAX_FILES } from '../utils/constants';
import {
  getMediaUploadOverallProgress,
  isMediaUploadInFlight,
  pickUploadsToStart,
  resolveMediaUpload
} from '../utils/media-upload-utils';
import type {
  MediaFileTransferOptions,
  MediaUploadItem,
  MediaUploadKind,
  MediaUploadRejection,
  MediaUploadSizeLimits,
  MediaUploadView
} from '../utils/types';
import { encodesVideoInBrowser, uploadMediaFile } from './media-file-transfer';

/**
 * Uploads media library files in the background of the whole app: the queue outlives the page that started it,
 * so the dialog and the minimized tray both render from this one instance.
 */
export class MediaUploadManager {
  items = $state<MediaUploadItem[]>([]);
  view = $state<MediaUploadView>('closed');
  isTrayExpanded = $state(true);
  completedCount = $state(0);

  private abortControllers = new SvelteMap<string, AbortController>();
  private stopping = $state<MediaUploadItem[]>([]);

  inFlightCount = $derived(this.items.filter(isMediaUploadInFlight).length);
  doneCount = $derived(this.items.filter((item) => item.status === 'done').length);
  failedCount = $derived(this.items.filter((item) => item.status === 'error').length);
  isUploading = $derived(this.inFlightCount > 0);
  allDone = $derived(this.items.length > 0 && this.doneCount === this.items.length);
  overallProgress = $derived(getMediaUploadOverallProgress(this.items));
  remainingSlots = $derived(Math.max(MEDIA_UPLOAD_MAX_FILES - this.inFlightCount, 0));

  constructor(
    private readonly transfer: (
      file: File,
      kind: MediaUploadKind,
      options: MediaFileTransferOptions
    ) => Promise<void> = uploadMediaFile
  ) {}

  open() {
    this.view = 'dialog';
  }

  minimize() {
    this.view = 'minimized';
    this.isTrayExpanded = true;
  }

  /** Closes the dialog. Uploads still running move to the minimized tray instead of being cancelled. */
  closeDialog() {
    if (this.isUploading) {
      this.minimize();
      return;
    }

    this.dismiss();
  }

  /** Hides the uploader and clears the list. Does nothing while a file is still uploading. */
  dismiss() {
    if (this.isUploading) return;

    this.items = [];
    this.view = 'closed';
  }

  toggleTray() {
    this.isTrayExpanded = !this.isTrayExpanded;
  }

  /**
   * Queues the files and starts uploading.
   * @returns the files that were skipped, each with the reason
   */
  add(files: File[], sizeLimits: MediaUploadSizeLimits): MediaUploadRejection[] {
    const rejections: MediaUploadRejection[] = [];
    let remainingSlots = this.remainingSlots;

    for (const file of files) {
      const resolved = resolveMediaUpload(file);
      if (!resolved) {
        rejections.push({ file, reason: 'unsupported_type' });
        continue;
      }

      const maxBytes = sizeLimits[resolved.kind];
      if (file.size > maxBytes) {
        rejections.push({ file, reason: 'too_large', maxBytes });
        continue;
      }

      if (remainingSlots === 0) {
        rejections.push({ file, reason: 'too_many' });
        continue;
      }

      remainingSlots -= 1;
      const normalizedFile =
        file.type === resolved.mimeType ? file : new File([file], file.name, { type: resolved.mimeType });

      this.items.push({
        id: crypto.randomUUID(),
        file: normalizedFile,
        kind: resolved.kind,
        status: 'queued',
        progress: 0,
        errorMessage: null
      });
    }

    this.pump();

    return rejections;
  }

  /** Cancels the upload if it is running and drops the file from the list. Its slot stays taken until it has stopped. */
  remove(id: string) {
    const removed = this.items.find((item) => item.id === id);
    if (removed?.status === 'uploading') this.stopping.push(removed);

    this.abortControllers.get(id)?.abort();
    this.abortControllers.delete(id);
    this.items = this.items.filter((item) => item.id !== id);
    this.pump();

    if (this.items.length === 0 && this.view === 'minimized') this.view = 'closed';
  }

  /** Aborts every upload and clears the list, whatever state the files are in. Running uploads keep their slots until they stop. */
  cancelAll() {
    this.stopping.push(...this.items.filter((item) => item.status === 'uploading'));

    for (const controller of this.abortControllers.values()) controller.abort();

    this.abortControllers.clear();
    this.items = [];
    this.view = 'closed';
  }

  /** Restarts a failed file. Does nothing while the queue is full. */
  retry(id: string) {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item || item.status !== 'error' || this.remainingSlots === 0) return;

    item.status = 'queued';
    item.progress = 0;
    item.errorMessage = null;
    this.pump();
  }

  private pump() {
    const isEncodedVideo = (item: MediaUploadItem) => item.kind === 'video' && encodesVideoInBrowser();

    for (const item of pickUploadsToStart([...this.items, ...this.stopping], isEncodedVideo)) {
      item.status = 'uploading';
      void this.upload(item);
    }
  }

  private async upload(item: MediaUploadItem) {
    const controller = new AbortController();
    this.abortControllers.set(item.id, controller);

    try {
      await this.transfer(item.file, item.kind, {
        signal: controller.signal,
        onProgress: (percent) => {
          item.progress = Math.max(item.progress, percent);
        }
      });

      if (controller.signal.aborted) return;

      item.progress = 100;
      item.status = 'done';
      this.completedCount += 1;
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error('Media upload error:', error);
      item.status = 'error';
      item.errorMessage = error instanceof Error ? error.message : null;
    } finally {
      this.abortControllers.delete(item.id);
      this.stopping = this.stopping.filter((stoppingItem) => stoppingItem.id !== item.id);
      this.pump();
    }
  }
}

export const mediaUploadManager = new MediaUploadManager();
