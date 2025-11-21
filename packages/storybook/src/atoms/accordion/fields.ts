import { type ComponentProps } from 'svelte';
import { Accordion } from '@cio/ui/base/accordion';

export const FIELDS: (keyof ComponentProps<typeof Accordion>)[] = [
  'type',
  'value',
  'onValueChange',
  'disabled',
  'name',
  'loop',
  'orientation'
];
