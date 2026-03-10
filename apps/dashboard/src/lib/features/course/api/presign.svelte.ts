import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  DocumentDownloadPresignRequest,
  DocumentUploadPresignRequest,
  VideoDownloadPresignRequest,
  VideoUploadPresignRequest
} from '../utils/types';

/**
 * API class for presigned URL requests (upload and download).
 * All presign calls should go through this class instead of calling classroomio.course.presign directly.
 */
export class PresignApi extends BaseApiWithErrors {
  /**
   * Gets a presigned upload URL for a document.
   * @returns { url, fileKey } on success
   */
  async getDocumentUploadUrl(fileName: string, fileType: string) {
    const result = await this.execute<DocumentUploadPresignRequest>({
      requestFn: () =>
        classroomio.course.presign.document.upload.$post({
          json: { fileName, fileType }
        }),
      logContext: 'getting document upload URL'
    });
    return result?.url != null && result?.fileKey != null ? { url: result.url, fileKey: result.fileKey } : null;
  }

  /**
   * Gets presigned download URLs for documents.
   * @param keys Array of document storage keys
   * @returns Record mapping keys to presigned URLs
   */
  async getDocumentDownloadUrls(keys: string[]) {
    if (keys.length === 0) return {};
    const result = await this.execute<DocumentDownloadPresignRequest>({
      requestFn: () =>
        classroomio.course.presign.document.download.$post({
          json: { keys }
        }),
      logContext: 'getting document download URLs'
    });
    return result?.urls ?? {};
  }

  /**
   * Gets a presigned upload URL for a video.
   * @returns { url, fileKey } on success
   */
  async getVideoUploadUrl(fileName: string, fileType: string) {
    const result = await this.execute<VideoUploadPresignRequest>({
      requestFn: () =>
        classroomio.course.presign.video.upload.$post({
          json: { fileName, fileType }
        }),
      logContext: 'getting video upload URL'
    });
    return result?.url != null && result?.fileKey != null ? { url: result.url, fileKey: result.fileKey } : null;
  }

  /**
   * Gets presigned download URLs for videos.
   * @param keys Array of video storage keys
   * @returns Record mapping keys to presigned URLs
   */
  async getVideoDownloadUrls(keys: string[]) {
    if (keys.length === 0) return {};
    const result = await this.execute<VideoDownloadPresignRequest>({
      requestFn: () =>
        classroomio.course.presign.video.download.$post({
          json: { keys }
        }),
      logContext: 'getting video download URLs'
    });
    return result?.urls ?? {};
  }
}

export const presignApi = new PresignApi();
