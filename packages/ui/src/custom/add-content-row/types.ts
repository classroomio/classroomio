import type { Component } from 'svelte';
import type { AddContentChoice } from '../add-content-menu/types';

export interface AddContentShortcut {
  modifier: string;
  key: string;
}

export type { AddContentChoice };

export type AddContentChoiceIcon = Component<{ size?: number | string; class?: string }>;
