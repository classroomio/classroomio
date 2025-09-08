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
}

export const uploadCourseDocumentStore = writable<DocumentUploadState>({
  isUploading: false,
  isModalOpen: false,
  uploadProgress: 0,
  uploadedDocument: null,
  error: null
});

export function resetDocumentUploadStore() {
  uploadCourseDocumentStore.set({
    isUploading: false,
    isModalOpen: false,
    uploadProgress: 0,
    uploadedDocument: null,
    error: null
  });
}
