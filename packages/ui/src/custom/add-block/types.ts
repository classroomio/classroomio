import type { Component } from 'svelte';

export interface AddBlockChoice {
  type: string;
  label: string;
  icon: Component<{ size?: number | string; class?: string }>;
  /** Marks a recently added block type with a New badge. */
  isNew?: boolean;
  /** One-line summary shown under the label in `AddBlock.Catalog`. */
  description?: string;
  /** Section heading the choice is listed under in `AddBlock.Catalog`. */
  group?: string;
  /** Shows a planned block type as a disabled tile with a Coming soon badge. */
  comingSoon?: boolean;
}

export interface AddBlockShortcut {
  modifier: string;
  key: string;
}

export type AddBlockChoiceIcon = Component<{ size?: number | string; class?: string }>;
