import { type ComponentProps } from 'svelte';
import { Command } from '@cio/ui/base/command';

export const FIELDS: (keyof ComponentProps<typeof Command>)[] = [
  'value',
  'onValueChange',
  'label',
  'filter',
  'columns',
  'ref',
  'disablePointerSelection'
];
