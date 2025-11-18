import { type ComponentProps } from 'svelte';
import { Tabs } from '@cio/ui/base/tabs';

export const FIELDS: (keyof ComponentProps<typeof Tabs>)[] = [
  'value',
  'onValueChange',
  'disabled',
  'activationMode',
  'orientation',
  'ref'
];
