import type { Component } from 'svelte';

export interface BlockShellMenuItem {
  label: string;
  icon?: Component<{ size?: number | string; class?: string }>;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
}
