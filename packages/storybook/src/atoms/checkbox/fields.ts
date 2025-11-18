import { type ComponentProps } from 'svelte';
import { Checkbox } from '@cio/ui/base/checkbox';

export const FIELDS: (keyof ComponentProps<typeof Checkbox>)[] = [
  'checked',
  'onCheckedChange',
  'disabled',
  'name',
  'value',
  'required'
];
