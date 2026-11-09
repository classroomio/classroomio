import type { Component } from 'svelte';

export interface AddBlockChoice {
  type: string;
  label: string;
  icon: Component<{ size?: number | string; class?: string }>;
}

export interface AddBlockShortcut {
  modifier: string;
  key: string;
}

export type AddBlockChoiceIcon = Component<{ size?: number | string; class?: string }>;
