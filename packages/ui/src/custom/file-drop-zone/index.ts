import Root from './file-drop-zone.svelte';
import Trigger from './file-drop-zone-trigger.svelte';
import Textarea from './file-drop-zone-textarea.svelte';
import type { FileDropZoneRootProps, FileDropZoneTriggerTextProps, FileRejectedReason } from './types';

export function displaySize(bytes: number): string {
  if (bytes < KILOBYTE) return `${bytes.toFixed(0)} B`;

  if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(0)} KB`;

  if (bytes < GIGABYTE) return `${(bytes / MEGABYTE).toFixed(0)} MB`;

  return `${(bytes / GIGABYTE).toFixed(0)} GB`;
}

// Utilities for working with file sizes
export const BYTE = 1;
export const KILOBYTE = 1000;
export const MEGABYTE = 1000 * KILOBYTE;
export const GIGABYTE = 1000 * MEGABYTE;

// utilities for limiting accepted files
export const ACCEPT_IMAGE = 'image/*';
export const ACCEPT_VIDEO = 'video/*';
export const ACCEPT_AUDIO = 'audio/*';

export {
  Root,
  Trigger,
  Textarea,
  type FileDropZoneRootProps,
  type FileDropZoneTriggerTextProps,
  type FileRejectedReason
};
export { Root as FileDropZone, Trigger as FileDropZoneTrigger, Textarea as FileDropZoneTextarea };
