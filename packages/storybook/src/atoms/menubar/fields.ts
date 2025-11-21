import { type ComponentProps } from 'svelte';
import { Menubar } from '@cio/ui/base/menubar';

export const FIELDS: (keyof ComponentProps<typeof Menubar>)[] = [
  'onValueChange',
  'value',
  'dir',
  'onOpenChange',
  'disabled'
];
