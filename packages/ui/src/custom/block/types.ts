import type { Component } from 'svelte';

export interface BlockShellMenuItem {
  label: string;
  icon?: Component<{ size?: number | string; class?: string }>;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
}

export type BlockLoaderTone = 'muted' | 'tint' | 'primary' | 'dark';

export interface BlockLoaderBlock {
  kind: string;
  title: string;
  tone: BlockLoaderTone;
  width: number;
}

export type ImageBlockFit = 'cover' | 'contain';

export interface ImageBlockSettings {
  alt: string;
  fit: ImageBlockFit;
}

export interface BlockDocumentLabels {
  view: string;
  download: string;
}
