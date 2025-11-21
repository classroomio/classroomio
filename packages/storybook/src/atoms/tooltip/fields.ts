import { type ComponentProps } from 'svelte';
import { Tooltip } from '@cio/ui/base/tooltip';

export const FIELDS: (keyof ComponentProps<typeof Tooltip>)[] = [
  'disableHoverableContent',
  'delayDuration',
  'ignoreNonKeyboardFocus',
  'disabled'
];
