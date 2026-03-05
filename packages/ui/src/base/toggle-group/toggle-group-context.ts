import type { ToggleGroupItemSize, ToggleGroupItemVariant } from './toggle-group-item.svelte';

export interface ToggleGroupContextValue {
  getVariant: () => ToggleGroupItemVariant;
  getSize: () => ToggleGroupItemSize;
}

export const TOGGLE_GROUP_CONTEXT = Symbol('toggle-group-context');
