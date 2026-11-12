import type { Component } from 'svelte';
import FileIcon from '@lucide/svelte/icons/file';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import FileVideoIcon from '@lucide/svelte/icons/file-video';
import ImageIcon from '@lucide/svelte/icons/image';
import Music2Icon from '@lucide/svelte/icons/music-2';

import type { AssetKindFilter, AssetStatusFilter } from './types';

export const ASSET_KIND_OPTIONS: AssetKindFilter[] = ['all', 'video', 'document', 'image', 'audio', 'other'];

export const ASSET_STATUS_OPTIONS: AssetStatusFilter[] = ['all', 'active', 'archived'];

export const KIND_ICON_MAP: Record<string, Component> = {
  video: FileVideoIcon,
  document: FileTextIcon,
  image: ImageIcon,
  audio: Music2Icon,
  other: FileIcon
};

export function getKindIcon(kindValue: string): Component {
  return KIND_ICON_MAP[kindValue] ?? FileIcon;
}

export const MEDIA_UPLOAD_MAX_FILES = 5;
export const MEDIA_UPLOAD_MAX_CONCURRENT = 5;
export const MEDIA_UPLOAD_MAX_CONCURRENT_VIDEO_ENCODES = 2;
export const MEDIA_UPLOAD_MAX_FILE_BYTES = 1024 * 1024 * 1024;

export const MEDIA_UPLOAD_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska'
] as const;
