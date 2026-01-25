import { lessonDocUpload, lessonVideoUpload } from '$features/course/components/lesson/store';

import axios from 'axios';
import { classroomio } from '$lib/utils/services/api';
import { get } from 'svelte/store';

export type UploadType = 'document' | 'video' | 'generic';

export class GenericUploader {
  public abortController: AbortController | null = null;
  private uploadType: UploadType;
  private uploadStore: typeof lessonDocUpload | typeof lessonVideoUpload;

  constructor(uploadType: UploadType) {
    this.uploadType = uploadType;
    this.uploadStore = uploadType === 'document' ? lessonDocUpload : lessonVideoUpload;
    this.abortController = new AbortController();
  }

  async getDownloadPresignedUrl(keys: string[], type = this.uploadType) {
    const endpoint =
      type === 'document' ? classroomio.course.presign.document.download : classroomio.course.presign.video.download;

    const response = await endpoint.$post({
      json: {
        keys
      }
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  }

  async getAllDownloadPresignedUrl(videoKeys: string[], docKeys: string[]) {
    const urls = {
      videos: {},
      documents: {}
    };

    try {
      if (videoKeys.length) {
        const videoResponse = await this.getDownloadPresignedUrl(videoKeys, 'video');
        urls.videos = videoResponse?.urls || {};
      }

      if (docKeys.length) {
        const docResponse = await this.getDownloadPresignedUrl(docKeys, 'document');
        urls.documents = docResponse?.urls || {};
      }
    } catch (error) {
      console.error('Error getting download presigned url:', error);
    }

    return urls;
  }

  async getPresignedUrl(file: File) {
    const endpoint =
      this.uploadType === 'document'
        ? classroomio.course.presign.document.upload
        : classroomio.course.presign.video.upload;

    const response = await endpoint.$post({
      json: {
        fileName: file?.name,
        fileType: file?.type
      }
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  }

  async uploadFile(params: { url: string; file: File }) {
    await axios.put(params.url, params.file, {
      headers: {
        'Content-Type': params.file.type
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      signal: this.abortController?.signal,
      onUploadProgress: (progressEvent) => {
        if (get(this.uploadStore).isCancelled) {
          this.abortController?.abort();
          return;
        }

        const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        this.uploadStore.update((state) => ({
          ...state,
          uploadProgress: progress
        }));
      }
    });
  }

  initUpload() {
    this.uploadStore.update((state) => ({
      ...state,
      isUploading: true,
      uploadProgress: 0,
      error: null,
      isCancelled: false
    }));

    this.abortController = new AbortController();
  }

  cancelUpload() {
    this.uploadStore.update((store) => ({
      ...store,
      isCancelled: true,
      isUploading: false
    }));

    this.abortController?.abort();
    this.abortController = null;
  }
}

export class DocumentUploader extends GenericUploader {
  constructor() {
    super('document');
  }
}

export class VideoUploader extends GenericUploader {
  constructor() {
    super('video');
  }
}
