import { writable } from 'svelte/store';

export interface DocumentUploadState {
  isUploading: boolean;
  isModalOpen: boolean;
  uploadProgress: number;
  uploadedDocument: {
    name: string;
    link: string;
    type: 'pdf' | 'docx' | 'doc';
    size: number;
  } | null;
  error: string | null;
  isCancelled: boolean;
}

export const lessonDocUpload = writable<DocumentUploadState>({
  isUploading: false,
  isModalOpen: false,
  uploadProgress: 0,
  uploadedDocument: null,
  error: null,
  isCancelled: false
});

export function resetDocumentUploadStore() {
  lessonDocUpload.set({
    isUploading: false,
    isModalOpen: false,
    uploadProgress: 0,
    uploadedDocument: null,
    error: null,
    isCancelled: false
  });
}
