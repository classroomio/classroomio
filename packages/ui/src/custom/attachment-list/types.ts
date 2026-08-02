export type AttachmentListFile = {
  id: string;
  name: string;
  size?: number;
  /** File extension (e.g. `pdf`, `docx`) or MIME type (e.g. `application/pdf`). Used for icon styling. */
  type?: string;
};

export type AttachmentListMode = 'view' | 'edit';

export type AttachmentListLabels = {
  title: string;
  fileCount: string;
  view: string;
  download: string;
  delete: string;
  reorder: string;
};
