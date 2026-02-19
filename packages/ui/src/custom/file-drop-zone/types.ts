import type { WithChildren } from 'bits-ui';
import type { WithElementRef } from 'svelte-toolbelt';
import type { HTMLInputAttributes, HTMLLabelAttributes } from 'svelte/elements';

export type FileRejectedReason = 'Maximum file size exceeded' | 'File type not allowed' | 'Maximum files uploaded';

export type FileDropZoneRootPropsWithoutHTML = WithChildren<{
  ref?: HTMLInputElement | null;
  id?: string;
  /** Called with the uploaded files when the user drops or clicks and selects their files.
   *
   * @param files
   */
  onUpload: (files: File[]) => Promise<void>;
  /** The maximum amount files allowed to be uploaded */
  maxFiles?: number;
  fileCount?: number;
  /** The maximum size of a file in bytes */
  maxFileSize?: number;
  /** Called when a file does not meet the upload criteria (size, or type) */
  onFileRejected?: (opts: { reason: FileRejectedReason; file: File }) => void;

  // just for extra documentation
  /** Takes a comma separated list of one or more file types.
   *
   *  [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept)
   *
   * ### Usage
   * ```svelte
   * <FileDropZone
   * 		accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
   * />
   * ```
   *
   * ### Common Values
   * ```svelte
   * <FileDropZone accept="audio/*"/>
   * <FileDropZone accept="image/*"/>
   * <FileDropZone accept="video/*"/>
   * ```
   */
  accept?: string;
}>;

export type FileDropZoneRootProps = FileDropZoneRootPropsWithoutHTML &
  Omit<HTMLInputAttributes, 'multiple' | 'files' | 'id' | 'class'>;

/** Text props for the default trigger UI. Pass translated strings from the app (e.g. via `$t()`). */
export type FileDropZoneTriggerTextProps = {
  /** Main instruction (e.g. "Drag 'n' drop files here, or click to select files") */
  label?: string;
  /** Format "You can upload N files" – receive translated string for the given count */
  formatMaxFiles?: (count: number) => string;
  /** Format "(up to SIZE each)" when both maxFiles and maxFileSize apply – SIZE is already formatted (e.g. "5 MB") */
  formatMaxFilesAndSize?: (size: string) => string;
  /** Format "Maximum size SIZE" when only maxFileSize applies – SIZE is already formatted */
  formatMaxSize?: (size: string) => string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type FileDropZoneTriggerPropsWithoutHTML = WithChildren<WithElementRef<FileDropZoneTriggerTextProps>>;

export type FileDropZoneTriggerProps = FileDropZoneTriggerPropsWithoutHTML & Omit<HTMLLabelAttributes, 'for'>;
