import { type ComponentProps } from 'svelte';
import { Spinner } from '@cio/ui/base/spinner';

export const FIELDS: (keyof ComponentProps<typeof Spinner>)[] = [
  'disableHoverableContent',
  'delayDuration',
  'ignoreNonKeyboardFocus',
  'disabled'
];
