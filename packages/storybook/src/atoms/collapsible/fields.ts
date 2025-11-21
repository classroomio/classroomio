import { type ComponentProps } from 'svelte';
import { Collapsible } from '@cio/ui/base/collapsible';

export const FIELDS: (keyof ComponentProps<typeof Collapsible>)[] = [
  'open',
  'onOpenChange',
  'onOpenChangeComplete',
  'disabled'
];
