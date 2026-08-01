export type AttachmentListFile = {
  id: string;
  name: string;
  size?: number;
  type?: string;
};

export type AttachmentListMode = 'view' | 'edit';

export type AttachmentListLabels = {
  title: string;
  fileCount: string;
  view: string;
  download: string;
  delete: string;
};
