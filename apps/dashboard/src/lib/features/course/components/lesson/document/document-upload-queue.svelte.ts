import axios from 'axios';
import {
  LESSON_DOCUMENT_ACCEPTED_TYPES,
  resolveFileUploadMimeType,
  resolveFileUploadTypeKey
} from '@cio/utils/file-upload';

import { lessonApi, presignApi } from '$features/course/api';
import { mediaApi } from '$features/media/api';
import { MAX_CONCURRENT_DOCUMENT_UPLOADS } from '$features/course/utils/document-upload-utils';
import type { DocumentUploadItem } from '$features/course/utils/types';

import { lessonDocUpload } from '../store';

const MAX_PROGRESS_BEFORE_REGISTRATION = 99;

export class DocumentUploadQueue {
  items = $state<DocumentUploadItem[]>([]);

  private lessonId = '';
  private abortControllers = new Map<string, AbortController>();

  isUploading = $derived(this.items.some((item) => item.status === 'queued' || item.status === 'uploading'));
  allDone = $derived(this.items.length > 0 && this.items.every((item) => item.status === 'done'));

  /** Starts uploading the files immediately. Files with unsupported types are skipped. */
  add(files: File[], lessonId: string) {
    this.lessonId = lessonId;

    for (const file of files) {
      const mimeType = resolveFileUploadMimeType(file, LESSON_DOCUMENT_ACCEPTED_TYPES);
      if (!mimeType) continue;

      const normalizedFile = file.type === mimeType ? file : new File([file], file.name, { type: mimeType });

      this.items.push({
        id: crypto.randomUUID(),
        file: normalizedFile,
        status: 'queued',
        progress: 0,
        position: this.nextPosition(),
        errorMessage: null
      });
    }

    this.pump();
  }

  /** Cancels the upload if it is running and drops the item from the list. */
  remove(id: string) {
    this.abortControllers.get(id)?.abort();
    this.abortControllers.delete(id);
    this.items = this.items.filter((item) => item.id !== id);
    this.pump();
    this.syncStore();
  }

  retry(id: string) {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item || item.status !== 'error') return;

    item.position = this.nextPosition();
    item.status = 'queued';
    item.progress = 0;
    item.errorMessage = null;
    this.pump();
  }

  reset() {
    for (const controller of this.abortControllers.values()) controller.abort();

    this.abortControllers.clear();
    this.items = [];
    this.syncStore();
  }

  private nextPosition() {
    const savedDocumentCount = lessonApi.lesson?.documents?.length ?? 0;
    const inFlightCount = this.items.filter((item) => item.status === 'queued' || item.status === 'uploading').length;

    return savedDocumentCount + inFlightCount;
  }

  private pump() {
    const activeCount = this.items.filter((item) => item.status === 'uploading').length;
    const slots = MAX_CONCURRENT_DOCUMENT_UPLOADS - activeCount;
    const waiting = this.items.filter((item) => item.status === 'queued').slice(0, Math.max(slots, 0));

    for (const item of waiting) {
      item.status = 'uploading';
      void this.upload(item);
    }

    this.syncStore();
  }

  private async upload(item: DocumentUploadItem) {
    const controller = new AbortController();
    this.abortControllers.set(item.id, controller);

    try {
      const presigned = await presignApi.getDocumentUploadUrl(item.file.name, item.file.type, item.file.size);
      if (!presigned) throw new Error('Failed to get presigned upload URL');

      await axios.put(presigned.url, item.file, {
        headers: { 'Content-Type': item.file.type },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        signal: controller.signal,
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || item.file.size || 1));
          item.progress = Math.min(percent, MAX_PROGRESS_BEFORE_REGISTRATION);
        }
      });

      const downloadUrls = await presignApi.getDocumentDownloadUrls([presigned.fileKey]);
      const documentUrl = downloadUrls[presigned.fileKey];

      const asset = await mediaApi.registerUploadedDocument({
        lessonId: this.lessonId,
        position: item.position,
        fileKey: presigned.fileKey,
        documentUrl,
        fileName: item.file.name,
        mimeType: item.file.type,
        byteSize: item.file.size
      });

      if (this.lessonId) {
        lessonApi.updateLessonState(
          'documents',
          [
            {
              type: resolveFileUploadTypeKey(item.file, LESSON_DOCUMENT_ACCEPTED_TYPES) ?? 'file',
              name: item.file.name,
              link: documentUrl,
              key: presigned.fileKey,
              size: item.file.size,
              assetId: asset?.id
            }
          ],
          { append: true }
        );
      }

      item.progress = 100;
      item.status = 'done';
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error('Document upload error:', error);
      item.status = 'error';
      item.errorMessage = error instanceof Error ? error.message : null;
    } finally {
      this.abortControllers.delete(item.id);
      this.pump();
    }
  }

  private syncStore() {
    lessonDocUpload.update((state) => ({ ...state, isUploading: this.isUploading, error: null }));
  }
}
