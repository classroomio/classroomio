export type FileRejectedReason = 'Maximum file size exceeded' | 'File type not allowed' | 'Maximum files uploaded';
export interface FileDropZoneProps {
  id?: string;
  /** called with the accepted files after drop or selection */
  onUpload: (files: File[]) => Promise<void> | void;
  onFileRejected?: (opts: { reason: FileRejectedReason; file: File }) => void;
  maxFiles?: number;
  /** files already uploaded; blocks further uploads once it reaches maxFiles */
  fileCount?: number;
  /** bytes */
  maxFileSize?: number;
  /** comma separated MIME types or extensions, e.g. "image/*,.pdf" */
  accept?: string;
  disabled?: boolean;
  label?: string;
  formatMaxFiles?: (count: number) => string;
  formatMaxFilesAndSize?: (size: string) => string;
  formatMaxSize?: (size: string) => string;
  /** replaces the default dashed trigger UI */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/** @startingPoint section="Forms" subtitle="Drag and drop file upload trigger" viewport="520x260" */
export declare function FileDropZone(props: FileDropZoneProps): JSX.Element;
export declare function displaySize(bytes: number): string;
export declare const BYTE: number;
export declare const KILOBYTE: number;
export declare const MEGABYTE: number;
export declare const GIGABYTE: number;
export declare const ACCEPT_IMAGE: string;
export declare const ACCEPT_VIDEO: string;
export declare const ACCEPT_AUDIO: string;
