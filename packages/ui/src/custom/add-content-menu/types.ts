import type { Component } from 'svelte';

export interface AddContentChoice {
  type: string;
  label: string;
  icon: Component<{ size?: number | string; class?: string }>;
}
