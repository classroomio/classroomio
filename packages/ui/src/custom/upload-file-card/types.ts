export type UploadFileCardStatus = 'queued' | 'uploading' | 'done' | 'error';

export type UploadFileCardLabels = {
  queued: string;
  completed: string;
  failed: string;
  retry: string;
  remove: string;
  /** Status text while a file is in flight, e.g. `Uploading 42%`. */
  uploading: (percent: number) => string;
  /** Transfer detail while a file is in flight, e.g. `1.9 MB of 2.3 MB`. */
  transferred: (uploaded: string, total: string) => string;
};
